# 19 — Production agentic RAG (capstone)
#
# 13 = entry: search or not.
# 17 = which strategy.
# This file = full desk loop: LLM route (17) + LLM CRAG grade (16) + grounded answer:
#
#   route → retrieve → grade →
#     correct   → refine → grounded answer + citations
#     ambiguous → LLM rewrite search query → retrieve again (bounded)
#     incorrect → refuse ("I don't know")
#   chitchat    → skip retrieve → short reply
#
# Caps: MAX_RETRIES (cost/latency). Strategy stand-ins from 04 / 07 / 09 / 14.
# Full failure map: 01.rag_failure_analysis.py
#
# Demo tickets (expected path):
#   "thanks, that helps"
#       → chitchat skip → short reply
#   "Can I return ORD-88421 and get money back to my card?"
#       → hybrid → grade correct → grounded answer
#   "uuh can i snd back ORD-88421?? money 2 my card pls"
#       → rewrite route → retrieve → answer
#   "If I return ORD-88421, how long until the refund hits my card, and who do I email?"
#       → multi-source → answer + citations
#   "Where is SKU-ACME-WIDGET-9X documented, and what is its stock price?"
#       → retrieve → grade incorrect → refuse

from __future__ import annotations

from pathlib import Path
from typing import Literal, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field
from rank_bm25 import BM25Okapi

load_dotenv()

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
RRF_K = 60
MISSING_RANK = 10**9
MAX_RETRIES = 1
TOP_K = 4
FALLBACK = "I don't have policy context for that."

TICKETS = [
    "thanks, that helps",
    "Can I return ORD-88421 and get money back to my card?",
    "uuh can i snd back ORD-88421?? money 2 my card pls",
    "If I return ORD-88421, how long until the refund hits my card, and who do I email?",
    "Where is SKU-ACME-WIDGET-9X documented, and what is its stock price?",
]

Grade = Literal["correct", "ambiguous", "incorrect"]
Route = Literal[
    "skip",
    "rewrite_hybrid",
    "hybrid",
    "decompose",
    "multi_source",
]


class Diagnosis(BaseModel):
    """LLM ticket router — pick one retrieve strategy."""

    route: Route = Field(
        description=(
            "skip = chitchat / thanks / no policy ask; "
            "rewrite_hybrid = slang, typos, messy chat that needs cleanup before search; "
            "hybrid = one clear policy ask on a single topic; "
            "decompose = two *policy* asks in one ticket (refund window AND shipping time); "
            "multi_source = needs policy desk AND contacts/email desk"
        )
    )
    why: str = Field(description="One short sentence explaining the route choice")
    cleaned_query: str = Field(
        default="",
        description="If rewrite_hybrid: cleaned policy search string. Else empty or echo.",
    )
    sub_queries: list[str] = Field(
        default_factory=list,
        description="If decompose: exactly 2 short search queries. Else empty.",
    )


class CragEvaluation(BaseModel):
    """LLM CRAG evaluator over the retrieved shortlist."""

    grade: Grade = Field(
        description=(
            "correct = enough relevant policy to answer; "
            "ambiguous = partial/weak evidence, rewrite search; "
            "incorrect = empty or off-corpus, refuse"
        )
    )
    relevant_indices: list[int] = Field(
        description="0-based indices of chunks that support the question"
    )
    reason: str = Field(description="One short sentence for the log")


class RewrittenQuery(BaseModel):
    query: str = Field(description="Clear policy search query for the next retrieve")


class State(TypedDict):
    question: str
    search_query: str
    route: str
    why: str
    sub_queries: list[str]
    docs: list[Document]
    relevant_docs: list[Document]
    grade: Grade
    retries: int
    answer: str
    citations: list[str]
    log: list[str]


def ingest_flat(folder: Path) -> tuple[InMemoryVectorStore, list[Document], BM25Okapi]:
    docs = [
        Document(
            page_content=path.read_text(encoding="utf-8").strip(),
            metadata={"source": path.name},
        )
        for path in sorted(folder.glob("*.txt"))
    ]
    splitter = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30)
    chunks = splitter.split_documents(docs)
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    store = InMemoryVectorStore.from_documents(chunks, embedding=embeddings)
    tokenized = [chunk.page_content.lower().split() for chunk in chunks]
    bm25 = BM25Okapi(tokenized)
    return store, chunks, bm25


def ingest_corpus(files: list[Path], corpus: str) -> InMemoryVectorStore:
    docs = [
        Document(
            page_content=path.read_text(encoding="utf-8").strip(),
            metadata={"source": path.name, "corpus": corpus},
        )
        for path in files
    ]
    splitter = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30)
    chunks = splitter.split_documents(docs)
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    return InMemoryVectorStore.from_documents(chunks, embedding=embeddings)


store, chunks, bm25 = ingest_flat(DATA)
policies = ingest_corpus(
    [DATA / "refund_policy.txt", DATA / "shipping_policy.txt"],
    "policies",
)
contacts = ingest_corpus([DATA / "contacts.txt"], "contacts")
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
ROUTER = MODEL.with_structured_output(Diagnosis)
GRADER = MODEL.with_structured_output(CragEvaluation)
REWRITER = MODEL.with_structured_output(RewrittenQuery)
print(
    f"ingest ready · {len(chunks)} flat chunks · MAX_RETRIES={MAX_RETRIES} · LLM route+grade"
)


def rrf_contribution(rank: int) -> float:
    if rank == MISSING_RANK:
        return 0.0
    return 1.0 / (RRF_K + rank + 1)


def hybrid(question: str, k: int = TOP_K) -> list[Document]:
    dense_hits = store.similarity_search(question, k=k)

    tokens = question.lower().split()
    bm25_scores = bm25.get_scores(tokens)
    sparse_order = sorted(
        range(len(bm25_scores)),
        key=lambda i: bm25_scores[i],
        reverse=True,
    )
    sparse_hits = [chunks[i] for i in sparse_order[:k]]

    ranks: dict[str, list] = {}

    for rank, doc in enumerate(dense_hits):
        key = doc.page_content
        if key not in ranks:
            ranks[key] = [MISSING_RANK, MISSING_RANK, doc]
        ranks[key][0] = rank

    for rank, doc in enumerate(sparse_hits):
        key = doc.page_content
        if key not in ranks:
            ranks[key] = [MISSING_RANK, MISSING_RANK, doc]
        ranks[key][1] = rank

    def fused_score(item: list) -> float:
        return rrf_contribution(item[0]) + rrf_contribution(item[1])

    fused = sorted(ranks.values(), key=fused_score, reverse=True)
    return [item[2] for item in fused[:k]]


# --- nodes ---


def route_ticket(state: State) -> dict:
    """LLM diagnose (17) — writes route + search_query; edge only reads route."""
    log = list(state.get("log") or [])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You route Acme order-support tickets to ONE retrieve strategy.\n"
                "Acme has: refund_policy, shipping_policy, contacts (support email).\n"
                "- thanks / ok / bye with no ask → skip\n"
                "- slang, typos, messy chat → rewrite_hybrid (fill cleaned_query)\n"
                "- refund + who to email / contact → multi_source\n"
                "- two distinct policy asks (refund AND shipping) → decompose "
                "(fill sub_queries with exactly 2 strings)\n"
                "- otherwise one clear policy ask → hybrid\n"
                "Prefer multi_source over decompose when contacts/email is needed.\n"
                "Unknown SKU / stock price still routes to hybrid; grade will refuse later."
            ),
            HumanMessagePromptTemplate.from_template("Ticket:\n{question}"),
        ]
    )
    diagnosis: Diagnosis = (prompt | ROUTER).invoke(
        {"question": state["question"]}
    )

    route = diagnosis.route
    cleaned = diagnosis.cleaned_query.strip()
    subs = [q.strip() for q in diagnosis.sub_queries if q.strip()]

    if route == "rewrite_hybrid":
        search_query = cleaned or state["question"]
    elif route == "skip":
        search_query = state["question"]
    else:
        search_query = cleaned or state["question"]

    if route == "decompose" and len(subs) < 2:
        subs = [
            "What is the Acme refund window after delivery?",
            "How long does standard shipping take for ORD-* orders?",
        ]

    log.append(f"route={route} · {diagnosis.why}")
    return {
        "route": route,
        "why": diagnosis.why,
        "search_query": search_query,
        "sub_queries": subs,
        "retries": 0,
        "docs": [],
        "relevant_docs": [],
        "log": log,
    }


def route_edge(state: State) -> str:
    return state["route"]


def skip_reply(state: State) -> dict:
    log = list(state["log"])
    log.append("skip → short reply (no RAG)")
    return {
        "answer": "You're welcome — glad that helped.",
        "citations": [],
        "grade": "correct",
        "log": log,
    }


def retrieve_hybrid(state: State) -> dict:
    docs = hybrid(state["search_query"], k=TOP_K)
    log = list(state["log"])
    log.append(
        f"retrieve.hybrid q={state['search_query']!r} → {len(docs)} chunks"
    )
    return {"docs": docs, "relevant_docs": [], "log": log}


def retrieve_rewrite_hybrid(state: State) -> dict:
    return retrieve_hybrid(state)


def retrieve_decompose(state: State) -> dict:
    parts = state["sub_queries"]
    stacked: list[Document] = []
    seen: set[str] = set()
    for part in parts:
        for doc in hybrid(part, k=2):
            if doc.page_content not in seen:
                seen.add(doc.page_content)
                stacked.append(doc)
    log = list(state["log"])
    log.append(f"retrieve.decompose parts={parts!r} → {len(stacked)} chunks")
    return {"docs": stacked, "relevant_docs": [], "log": log}


def retrieve_multi_source(state: State) -> dict:
    q = state["search_query"]
    merged: list[Document] = []
    seen: set[str] = set()
    for hit in policies.similarity_search(q, k=2) + contacts.similarity_search(q, k=2):
        if hit.page_content not in seen:
            seen.add(hit.page_content)
            merged.append(hit)
    log = list(state["log"])
    log.append(f"retrieve.multi_source → {len(merged)} chunks")
    return {"docs": merged, "relevant_docs": [], "log": log}


def grade_docs(state: State) -> dict:
    """LLM CRAG grade (16) — correct / ambiguous / incorrect + knowledge refine."""
    docs = state["docs"]
    log = list(state["log"])

    if not docs:
        log.append("grade=incorrect · empty retrieval")
        return {"grade": "incorrect", "relevant_docs": [], "log": log}

    numbered = "\n\n".join(
        f"[{i}] ({d.metadata.get('source', '?')}) {d.page_content}"
        for i, d in enumerate(docs)
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are a CRAG retrieval evaluator for Acme order-support policies.\n"
                "- correct: enough on-topic policy to answer faithfully\n"
                "- ambiguous: partial/weak evidence — prefer rewrite\n"
                "- incorrect: empty, off-topic, or outside corpus "
                "(unknown SKUs, stock prices, planets, etc.)\n"
                "Put only supporting chunk indices in relevant_indices."
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nSearch query used:\n{search_query}\n\n"
                "Retrieved chunks:\n{chunks}"
            ),
        ]
    )
    evaluation: CragEvaluation = (prompt | GRADER).invoke(
        {
            "question": state["question"],
            "search_query": state["search_query"],
            "chunks": numbered,
        }
    )

    relevant: list[Document] = []
    for i in evaluation.relevant_indices:
        if 0 <= i < len(docs):
            relevant.append(docs[i])

    grade_value: Grade = evaluation.grade
    note = evaluation.reason
    if grade_value == "correct" and not relevant:
        grade_value = "ambiguous"
        note = "LLM said correct but kept no chunks → ambiguous"

    sources = sorted({d.metadata.get("source", "?") for d in docs})
    log.append(
        f"grade={grade_value} · {note} · kept={len(relevant)}/{len(docs)} · "
        f"sources={sources}"
    )
    return {"grade": grade_value, "relevant_docs": relevant, "log": log}


def after_grade(state: State) -> str:
    if state["grade"] == "correct":
        return "answer"
    if state["grade"] == "incorrect":
        return "refuse"
    if state["retries"] < MAX_RETRIES:
        return "rewrite"
    return "refuse"


def rewrite_for_retry(state: State) -> dict:
    """LLM corrective rewrite (CRAG ambiguous branch)."""
    retries = state["retries"] + 1
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Rewrite the support ticket into one clear search query for Acme "
                "refund/shipping/contact policy docs. Keep any ORD-* order id. "
                "Use plain policy vocabulary. No slang. One line only."
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket: {question}\nPrevious search: {search_query}"
            ),
        ]
    )
    rewritten: RewrittenQuery = (prompt | REWRITER).invoke(
        {
            "question": state["question"],
            "search_query": state["search_query"],
        }
    )
    new_q = rewritten.query.strip() or state["search_query"]
    log = list(state["log"])
    log.append(f"retry#{retries} rewrite search_query → {new_q!r}")
    return {
        "search_query": new_q,
        "retries": retries,
        "route": "hybrid",
        "log": log,
    }


def refuse(state: State) -> dict:
    log = list(state["log"])
    log.append("refuse → fallback")
    return {"answer": FALLBACK, "citations": [], "log": log}


def grounded_answer(state: State) -> dict:
    docs = state["relevant_docs"] or state["docs"]
    citations = sorted({d.metadata.get("source", "?") for d in docs})
    context = "\n\n".join(
        f"[{d.metadata.get('source', '?')}] {d.page_content}" for d in docs
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Acme order support. Answer ONLY from the policy context below. "
                "If the context does not say, reply exactly: "
                + FALLBACK
                + "\nDo not invent fees, portals, or timelines.\n"
                "End with one line using real filenames, e.g. "
                "Sources: refund_policy.txt\n\nContext:\n{context}"
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {"context": context, "question": state["question"]}
    )
    log = list(state["log"])
    log.append(f"answer · citations={citations}")
    return {"answer": reply.content, "citations": citations, "log": log}


# --- graph ---

graph = StateGraph(State)
graph.add_node("route_ticket", route_ticket)
graph.add_node("skip_reply", skip_reply)
graph.add_node("retrieve_hybrid", retrieve_hybrid)
graph.add_node("retrieve_rewrite_hybrid", retrieve_rewrite_hybrid)
graph.add_node("retrieve_decompose", retrieve_decompose)
graph.add_node("retrieve_multi_source", retrieve_multi_source)
graph.add_node("grade_docs", grade_docs)
graph.add_node("rewrite_for_retry", rewrite_for_retry)
graph.add_node("grounded_answer", grounded_answer)
graph.add_node("refuse", refuse)

graph.add_edge(START, "route_ticket")
graph.add_conditional_edges(
    "route_ticket",
    route_edge,
    {
        "skip": "skip_reply",
        "hybrid": "retrieve_hybrid",
        "rewrite_hybrid": "retrieve_rewrite_hybrid",
        "decompose": "retrieve_decompose",
        "multi_source": "retrieve_multi_source",
    },
)
graph.add_edge("skip_reply", END)

for retrieve_node in (
    "retrieve_hybrid",
    "retrieve_rewrite_hybrid",
    "retrieve_decompose",
    "retrieve_multi_source",
):
    graph.add_edge(retrieve_node, "grade_docs")

graph.add_conditional_edges(
    "grade_docs",
    after_grade,
    {
        "answer": "grounded_answer",
        "rewrite": "rewrite_for_retry",
        "refuse": "refuse",
    },
)
graph.add_edge("rewrite_for_retry", "retrieve_hybrid")
graph.add_edge("grounded_answer", END)
graph.add_edge("refuse", END)

app = graph.compile()

print("=" * 60)
print("19 — Production agentic RAG")
print("LLM route → retrieve → LLM grade → [answer | rewrite→retrieve | refuse]")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "search_query": "",
            "route": "",
            "why": "",
            "sub_queries": [],
            "docs": [],
            "relevant_docs": [],
            "grade": "incorrect",
            "retries": 0,
            "answer": "",
            "citations": [],
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  answer: {result['answer']}")
    if result["citations"]:
        print(f"  citations: {result['citations']}")

print("\n" + "=" * 60)
print("13 search-or-not · 17 LLM route · 16 LLM grade · 19 full desk")
print("=" * 60)
