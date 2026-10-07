# 17 — Adaptive router (LLM diagnose)
#
# Ticket complexity → which retrieve strategy (LangGraph conditional edges).
#
# 13 decides search or not. This file picks *which* retrieve path to run.
#
# Demo tickets (expected route ← earlier lesson that owns that strategy):
#   "thanks, that helps"
#       → skip_search          (13 agentic skip)
#   "uuh can i snd back ORD-88421?? money 2 my card pls"
#       → rewrite_hybrid       (07 rewrite + 04 hybrid)
#   "Can I return ORD-88421 and get money back to my card?"
#       → hybrid               (04)
#   "What is the refund window, and how long does standard shipping take?"
#       → decompose            (09)
#   "If I return ORD-88421, how long until the refund hits my card, and who do I email?"
#       → multi_source         (14)
#
# Production: an LLM (or cheap classifier) *diagnoses* the ticket and writes
#   route + why into state. Rules alone break on paraphrases. Many desks still
#   keep a few hard gates (safety, PII) *before* the LLM; the menu of routes
#   is still model-chosen. This file uses structured LLM diagnose end-to-end.
#
# The conditional edge only reads route — it does not re-decide.
# Strategy nodes are short stand-ins for the deep lessons — the graph shape
# is the point. Full production loop (grade → retry) is 19.
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

Route = Literal[
    "skip_search",
    "rewrite_hybrid",
    "hybrid",
    "decompose",
    "multi_source",
]

TICKETS = [
    "thanks, that helps",
    "uuh can i snd back ORD-88421?? money 2 my card pls",
    "Can I return ORD-88421 and get money back to my card?",
    "What is the refund window, and how long does standard shipping take?",
    "If I return ORD-88421, how long until the refund hits my card, and who do I email?",
]


class Diagnosis(BaseModel):
    """LLM ticket router — one of five retrieve strategies."""

    route: Route = Field(
        description=(
            "skip_search = chitchat / thanks / no policy ask; "
            "rewrite_hybrid = slang, typos, messy chat that needs cleanup before search; "
            "hybrid = one clear policy ask on a single topic; "
            "decompose = two *policy* asks in one ticket (e.g. refund window AND shipping time); "
            "multi_source = needs policy desk AND contacts/email desk"
        )
    )
    why: str = Field(description="One short sentence explaining the route choice")
    cleaned_query: str = Field(
        default="",
        description=(
            "If rewrite_hybrid: a cleaned policy search string. "
            "Otherwise empty or echo the ticket."
        ),
    )
    sub_queries: list[str] = Field(
        default_factory=list,
        description=(
            "If decompose: 2 short search queries, one per policy ask. "
            "Otherwise empty."
        ),
    )


class State(TypedDict):
    question: str
    route: str
    why: str
    cleaned_query: str
    sub_queries: list[str]
    hits: list[str]


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
print(f"ingest flat + policies + contacts · {len(chunks)} flat chunks · LLM diagnose")


def preview(docs: list[Document], n: int = 3) -> list[str]:
    out = []
    for doc in docs[:n]:
        corpus = doc.metadata.get("corpus")
        tag = f"[{corpus}] " if corpus else ""
        source = doc.metadata["source"]
        snippet = doc.page_content.replace("\n", " ")[:55]
        out.append(f"{tag}{source}: {snippet}...")
    return out


def rrf_contribution(rank: int) -> float:
    if rank == MISSING_RANK:
        return 0.0
    return 1.0 / (RRF_K + rank + 1)


def hybrid(question: str, k: int = 4) -> list[Document]:
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


def diagnose(state: State) -> dict:
    """Routing NODE — LLM writes route + why (auditable). Edge only reads route."""
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You route Acme order-support tickets to ONE retrieve strategy.\n"
                "Acme has: refund_policy, shipping_policy, contacts (support email).\n"
                "Rules of thumb:\n"
                "- thanks / ok / bye with no ask → skip_search\n"
                "- slang, typos, 'uuh', 'snd', 'pls', 'money 2' → rewrite_hybrid "
                "(also fill cleaned_query)\n"
                "- refund + who to email / contact → multi_source\n"
                "- refund/return window AND shipping/delivery time as two asks → "
                "decompose (also fill sub_queries with exactly 2 strings)\n"
                "- otherwise one clear policy ask → hybrid\n"
                "Prefer multi_source over decompose when contacts/email is needed.\n"
                "Prefer decompose over hybrid when there are clearly two policy questions."
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

    if route == "rewrite_hybrid" and not cleaned:
        cleaned = state["question"]
    if route == "decompose" and len(subs) < 2:
        subs = [
            "What is the Acme refund window after delivery?",
            "How long does standard shipping take for ORD-* orders?",
        ]

    return {
        "route": route,
        "why": diagnosis.why,
        "cleaned_query": cleaned,
        "sub_queries": subs,
        "hits": [],
    }


def route_edge(state: State) -> str:
    """Conditional EDGE — thin: only returns state['route']."""
    return state["route"]


def skip_search(state: State) -> dict:
    return {
        "hits": ["(no retrieval)"],
        "why": state["why"] + " → took skip_search",
    }


def rewrite_hybrid(state: State) -> dict:
    cleaned = state["cleaned_query"] or state["question"]
    hits = hybrid(cleaned, k=3)
    return {
        "hits": preview(hits),
        "why": state["why"] + f" → rewrote to {cleaned!r}, then hybrid",
    }


def hybrid_path(state: State) -> dict:
    hits = hybrid(state["question"], k=3)
    return {
        "hits": preview(hits),
        "why": state["why"] + " → hybrid RRF on flat index",
    }


def decompose(state: State) -> dict:
    parts = state["sub_queries"]
    stacked: list[Document] = []
    seen: set[str] = set()
    for part in parts:
        for doc in hybrid(part, k=2):
            if doc.page_content not in seen:
                seen.add(doc.page_content)
                stacked.append(doc)
    return {
        "hits": preview(stacked, n=4),
        "why": state["why"] + f" → parts {parts!r}",
    }


def multi_source(state: State) -> dict:
    q = state["question"]
    merged: list[Document] = []
    seen: set[str] = set()
    for hit in policies.similarity_search(q, k=2) + contacts.similarity_search(q, k=2):
        if hit.page_content not in seen:
            seen.add(hit.page_content)
            merged.append(hit)
    return {
        "hits": preview(merged, n=4),
        "why": state["why"] + " → fan-out policies + contacts, then merge",
    }


def report(state: State) -> dict:
    print(f"  route  : {state['route']}")
    print(f"  why    : {state['why']}")
    print("  hits   :")
    for line in state["hits"]:
        print(f"    → {line}")
    return {}


graph = StateGraph(State)
graph.add_node("diagnose", diagnose)
graph.add_node("skip_search", skip_search)
graph.add_node("rewrite_hybrid", rewrite_hybrid)
graph.add_node("hybrid", hybrid_path)
graph.add_node("decompose", decompose)
graph.add_node("multi_source", multi_source)
graph.add_node("report", report)

graph.add_edge(START, "diagnose")
graph.add_conditional_edges(
    "diagnose",
    route_edge,
    {
        "skip_search": "skip_search",
        "rewrite_hybrid": "rewrite_hybrid",
        "hybrid": "hybrid",
        "decompose": "decompose",
        "multi_source": "multi_source",
    },
)
graph.add_edge("skip_search", "report")
graph.add_edge("rewrite_hybrid", "report")
graph.add_edge("hybrid", "report")
graph.add_edge("decompose", "report")
graph.add_edge("multi_source", "report")
graph.add_edge("report", END)
app = graph.compile()

print("=" * 60)
print("17 — Adaptive router (LLM diagnose → branch → why)")
print("graph: diagnose → [skip | rewrite_hybrid | hybrid | decompose | multi_source] → report")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    app.invoke(
        {
            "question": question,
            "route": "",
            "why": "",
            "cleaned_query": "",
            "sub_queries": [],
            "hits": [],
        }
    )

print("\n" + "=" * 60)
print("13 = search or not. 17 = which strategy (LLM). 19 = grade → retry.")
print("=" * 60)
