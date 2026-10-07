# 16 — CRAG (corrective retrieve loop)
#
# After every retrieve, *grade* the chunks before you generate.
#
#   retrieve → grade →
#     correct   → refine (keep relevant) → grounded generate + citations
#     ambiguous → LLM rewrite query → retrieve again (bounded)
#     incorrect → refuse / "I don't know"
#
# CRAG (Corrective RAG, Yan et al.): evaluator on retrieved docs →
#   correct / ambiguous / incorrect, then branch.
# here = LLM grader + LLM rewriter + knowledge refine + citations
#   + hybrid RRF. Classroom still uses a local corpus (no web fallback).
#   Real CRAG papers often add web search on "incorrect"; 19 adds routing
#   and multi-source on top of this same grade loop.
#
# Self-RAG (Asai et al.) is a related reflection idea (special tokens) —
#   not implemented here; this file is CRAG.
#
# Vs 12 iterative: 12 fills missing *sources*. 16 grades *relevance quality*.
# Vs 13: 13 decides search or not up front. 16 always retrieves, then corrects.
# Vs 19: 19 adds adaptive routing + multi-source on top of this grade loop.
#
# Full failure map: 01.rag_failure_analysis.py

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

CASES = [
    ("correct → refine → generate", "Can I return ORD-88421 and get money back to my card?"),
    (
        # LLM may still mark correct if hybrid already retrieved strong policy.
        # Rewrite fires only when the grader returns ambiguous (or correct+empty keep).
        "slang ticket → LLM grade (rewrite if ambiguous)",
        "uuh how long till cash hits after i snd the box back for ORD-88421??",
    ),
    (
        "incorrect → refuse",
        "Where is SKU-ACME-WIDGET-9X documented, and what is its stock price?",
    ),
]

Grade = Literal["correct", "ambiguous", "incorrect"]


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
        description="0-based indices of chunks that support the question (empty if incorrect)"
    )
    reason: str = Field(description="One short sentence for the log")


class RewrittenQuery(BaseModel):
    query: str = Field(description="Clear policy search query for the next retrieve")


class State(TypedDict):
    question: str
    search_query: str
    docs: list[Document]
    relevant_docs: list[Document]
    grade: Grade
    retries: int
    answer: str
    citations: list[str]
    log: list[str]


def ingest(folder: Path) -> tuple[InMemoryVectorStore, list[Document], BM25Okapi]:
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
    print(f"ingest {len(docs)} docs → {len(chunks)} chunks · MAX_RETRIES={MAX_RETRIES}")
    return store, chunks, bm25


store, chunks, bm25 = ingest(DATA)
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
GRADER = MODEL.with_structured_output(CragEvaluation)
REWRITER = MODEL.with_structured_output(RewrittenQuery)


def rrf_contribution(rank: int) -> float:
    if rank == MISSING_RANK:
        return 0.0
    return 1.0 / (RRF_K + rank + 1)


def hybrid(question: str, k: int = TOP_K) -> list[Document]:
    """Dense + BM25, fused with Reciprocal Rank Fusion (k=60)."""
    dense_hits = store.similarity_search(question, k=k)

    tokens = question.lower().split()
    bm25_scores = bm25.get_scores(tokens)
    sparse_order = sorted(
        range(len(bm25_scores)),
        key=lambda i: bm25_scores[i],
        reverse=True,
    )
    sparse_hits = [chunks[i] for i in sparse_order[:k]]

    # key → [dense_rank, sparse_rank, Document]
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
        dense_rank = item[0]
        sparse_rank = item[1]
        return rrf_contribution(dense_rank) + rrf_contribution(sparse_rank)

    fused = sorted(ranks.values(), key=fused_score, reverse=True)
    return [item[2] for item in fused[:k]]


def retrieve(state: State) -> dict:
    q = state["search_query"] or state["question"]
    docs = hybrid(q, k=TOP_K)
    sources = sorted({d.metadata["source"] for d in docs})
    log = list(state.get("log") or [])
    log.append(f"retrieve q={q!r} → sources={sources}")
    return {
        "docs": docs,
        "search_query": q,
        "relevant_docs": [],
        "log": log,
    }


def grade(state: State) -> dict:
    """
    CRAG evaluator: LLM grades the shortlist and picks
    which chunk indices are relevant enough to keep (knowledge refine).
    """
    docs = state["docs"]
    log = list(state["log"])

    if not docs:
        log.append("grade=incorrect · empty retrieval")
        return {
            "grade": "incorrect",
            "relevant_docs": [],
            "log": log,
        }

    numbered = "\n\n".join(
        f"[{i}] ({d.metadata['source']}) {d.page_content}" for i, d in enumerate(docs)
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are a CRAG retrieval evaluator for Acme order-support policies.\n"
                "Grade the retrieved chunks for answering the ticket.\n"
                "- correct: ticket is clear enough AND chunks support a faithful answer\n"
                "- ambiguous: evidence is partial/weak, OR the ticket wording is too slangy/"
                "vague to trust without a cleaned search query — choose rewrite\n"
                "- incorrect: empty, off-topic, or ask is outside Acme policy corpus "
                "(unknown SKUs, stock prices, planets, etc.)\n"
                "Do not invent keyword lists — judge the ticket + chunks as a whole.\n"
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

    # Guard: "correct" with zero kept chunks cannot ground an answer → rewrite once.
    grade_value: Grade = evaluation.grade
    note = evaluation.reason
    if grade_value == "correct" and not relevant:
        grade_value = "ambiguous"
        note = "LLM said correct but kept no chunks → ambiguous"

    log.append(
        f"grade={grade_value} · {note} · kept={len(relevant)}/{len(docs)}"
    )
    return {
        "grade": grade_value,
        "relevant_docs": relevant,
        "log": log,
    }


def after_grade(state: State) -> str:
    if state["grade"] == "correct":
        return "generate"
    if state["grade"] == "incorrect":
        return "refuse"
    if state["retries"] < MAX_RETRIES:
        return "rewrite"
    return "refuse"


def rewrite(state: State) -> dict:
    """Ambiguous branch: LLM rewrites into clear policy search language."""
    retries = state["retries"] + 1
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Rewrite the support ticket into one clear search query for Acme "
                "refund/shipping/contact policy docs. Keep any ORD-* order id. "
                "Use plain policy vocabulary (return, refund, payment method, timeline). "
                "No slang. One line only."
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
    log.append(f"rewrite#{retries} → {new_q!r}")
    return {
        "search_query": new_q,
        "retries": retries,
        "log": log,
    }


def generate(state: State) -> dict:
    # Prefer refined relevant docs; fall back to full shortlist if empty.
    docs = state["relevant_docs"] or state["docs"]
    citations = sorted({d.metadata["source"] for d in docs})
    context = "\n\n".join(
        f"[{d.metadata['source']}] {d.page_content}" for d in docs
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Acme order support. Answer ONLY from the policy context below. "
                "If missing, reply exactly: "
                + FALLBACK
                + "\nDo not invent fees or portals.\n"
                "End with one line using the real filenames from context, e.g. "
                "Sources: refund_policy.txt\n\n"
                "Context:\n{context}"
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {"context": context, "question": state["question"]}
    )
    log = list(state["log"])
    log.append(f"generate · grounded · citations={citations}")
    return {
        "answer": reply.content,
        "citations": citations,
        "log": log,
    }


def refuse(state: State) -> dict:
    log = list(state["log"])
    log.append("refuse → fallback")
    return {
        "answer": FALLBACK,
        "citations": [],
        "log": log,
    }


graph = StateGraph(State)
graph.add_node("retrieve", retrieve)
graph.add_node("grade", grade)
graph.add_node("rewrite", rewrite)
graph.add_node("generate", generate)
graph.add_node("refuse", refuse)

graph.add_edge(START, "retrieve")
graph.add_edge("retrieve", "grade")
graph.add_conditional_edges(
    "grade",
    after_grade,
    {
        "generate": "generate",
        "rewrite": "rewrite",
        "refuse": "refuse",
    },
)
graph.add_edge("rewrite", "retrieve")
graph.add_edge("generate", END)
graph.add_edge("refuse", END)
app = graph.compile()

print("=" * 60)
print("16 — CRAG")
print("retrieve → grade → [refine+generate | rewrite→retrieve | refuse]")
print("=" * 60)

for label, question in CASES:
    print(f"\nCASE: {label}")
    print(f"ticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "search_query": question,
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
    if result["citations"]:
        print(f"  citations: {result['citations']}")
    print(f"  answer: {result['answer']}")

print("\n" + "=" * 60)
print("CRAG = LLM grade → branch (refine / rewrite / refuse).")
print("19 stacks adaptive routing + multi-source on this loop.")
print("=" * 60)
