# 12 — Shared state (Acme order-support)
#
# One TypedDict for the whole graph. Nodes return partial updates only.
# Use reducers for fields multiple agents append to (artifacts, citations, log).
#
#   ticket → planner → researcher (Day 2 RAG) → writer → answer
#
# Rules:
# - one schema for the whole graph
# - each node returns partial updates only
# - no hidden global variables
#
# Without Annotated[..., add], the last writer overwrites list fields.
# status is plain str — last write wins (intentional contrast with artifacts).
#
# Ties to Day 1 LangGraph state + reducers, and Day 2 checkpointers for
# long-running multi-agent workflows.
#
# When: planner → researcher → writer must accumulate artifacts.
# Skip when: agents are fire-and-forget with no shared memory.
#
# Demo ticket:
#   "Can I return ORD-88421 and get money back to my card?"

from __future__ import annotations

from operator import add
from pathlib import Path
from typing import Annotated, TypedDict

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

load_dotenv()

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
TOP_K = 3
FALLBACK = "I don't have policy context for that. Email help@acme.example."

TICKET = {
    "ticket_id": "TCK-1207",
    "user_id": "cust-88421",
    "question": "Can I return ORD-88421 and get money back to my card?",
}


class SharedState(TypedDict):
    """One schema — every node reads/writes slices of this bag."""

    ticket_id: str
    user_id: str
    question: str
    # Reducers: parallel or sequential appenders concatenate instead of overwrite.
    artifacts: Annotated[list[str], add]
    citations: Annotated[list[str], add]
    log: Annotated[list[str], add]
    # Plain field: each write replaces the previous value.
    status: str
    answer: str


def ingest(folder: Path) -> InMemoryVectorStore:
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
    return InMemoryVectorStore.from_documents(chunks, embedding=embeddings)


store = ingest(DATA)
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
print("ingest flat Acme policies · shared state pipeline ready")


def planner(state: SharedState) -> dict:
    """Partial update — only the fields this node owns."""
    plan = (
        f"plan[{state['ticket_id']}]: retrieve refund/shipping/contacts policy → "
        f"draft grounded reply for {state['user_id']}"
    )
    return {
        "artifacts": [plan],
        "status": "planned",
        "log": ["planner · wrote plan artifact"],
    }


def researcher(state: SharedState) -> dict:
    """Reads shared question; appends research artifact + citations."""
    hits = store.similarity_search(state["question"], k=TOP_K)
    sources = sorted({h.metadata["source"] for h in hits}) if hits else []
    context = (
        "\n\n".join(f"[{h.metadata['source']}] {h.page_content}" for h in hits)
        if hits
        else "(empty)"
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme researcher. Write ONE short internal brief "
                "(2–4 sentences) from policy context only. If empty: {fallback}"
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket {ticket_id} / {user_id}:\n{question}\n\n"
                "Policy context:\n{context}"
            ),
        ]
    )
    brief = (prompt | MODEL).invoke(
        {
            "fallback": FALLBACK,
            "ticket_id": state["ticket_id"],
            "user_id": state["user_id"],
            "question": state["question"],
            "context": context,
        }
    ).content
    note = f"research[{state['ticket_id']}]: {brief}"
    return {
        "artifacts": [note],
        "citations": sources,
        "status": "researched",
        "log": [f"researcher · sources={sources}"],
    }


def writer(state: SharedState) -> dict:
    """Reads accumulated artifacts; appends final doc; sets answer."""
    packet = "\n".join(state["artifacts"])
    allowed = ", ".join(sorted(set(state.get("citations") or []))) or "(none)"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme support writer. Use the shared artifacts bag.\n"
                "Facts only from the research brief. Do NOT invent portals, "
                "account UI steps, URLs, fees, or phones absent from artifacts.\n"
                f"End with Sources: using filenames from: {allowed}"
            ),
            HumanMessagePromptTemplate.from_template(
                "Question:\n{question}\n\nShared artifacts:\n{packet}"
            ),
        ]
    )
    answer = (prompt | MODEL).invoke(
        {"question": state["question"], "packet": packet}
    ).content
    final = f"final_doc[{state['ticket_id']}]: {answer[:120]}…"
    return {
        "artifacts": [final],
        "answer": answer,
        "status": "done",
        "log": [
            f"writer · joined {len(state['artifacts'])} prior artifacts · "
            f"status was '{state['status']}' before this write"
        ],
    }


graph = StateGraph(SharedState)
graph.add_node("planner", planner)
graph.add_node("researcher", researcher)
graph.add_node("writer", writer)
graph.add_edge(START, "planner")
graph.add_edge("planner", "researcher")
graph.add_edge("researcher", "writer")
graph.add_edge("writer", END)
app = graph.compile()

print("=" * 60)
print("12 — Shared state (Acme)")
print("planner → researcher → writer  (one TypedDict)")
print("=" * 60)
print(f"ticket_id={TICKET['ticket_id']} user_id={TICKET['user_id']}")
print(f"question: {TICKET['question']}")

result = app.invoke(
    {
        **TICKET,
        "artifacts": [],
        "citations": [],
        "log": [],
        "status": "new",
        "answer": "",
    }
)

print(f"\nstatus (last write wins): {result['status']}")
print("artifacts (Annotated add — all three kept):")
for a in result["artifacts"]:
    preview = a if len(a) <= 140 else a[:140] + "…"
    print(f"  · {preview}")
print(f"citations: {result['citations']}")
print("\nlog:")
for line in result["log"]:
    print(f"  · {line}")
print(f"\nanswer:\n{result['answer']}")
print("\n" + "=" * 60)
print("Without Annotated add, researcher would erase the plan artifact.")
print("status stayed a plain str — only 'done' remains.")
print("=" * 60)
