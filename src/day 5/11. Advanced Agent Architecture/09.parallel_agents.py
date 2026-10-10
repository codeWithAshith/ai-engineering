# 09 — Parallel agents (Acme order-support)
#
# Fan out independent workers at the same time, then join.
# Each worker writes findings via Annotated[list, add] — LangGraph merges.
#
#   ticket → refund_worker ┐
#            shipping_worker ┼→ summarize → answer
#            contacts_worker ┘
#
# Same Day 2 Acme corpus. Each worker may only read its own index.
# Real fan-out edges (not a toy loop inside one node).
#
# Vs 10 sequential: parallel needs independence; sequential needs order.
# Vs 02 workers: 02 plans ordered jobs; here all three always run together.
# Vs Day 1 parallel fixed edges: same join shape — merge waits for every branch.
# When: wall-clock latency matters and subtasks do not depend on each other.
# Skip when: step B needs step A's output (use 03 / 10).
#
# Demo ticket (all three branches fire):
#   "If I return ORD-88421, how long until the refund hits my card,
#    what's standard shipping for a replacement, and who do I email?"

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
FALLBACK = "I don't have policy context for that."

TICKET = (
    "If I return ORD-88421, how long until the refund hits my card, "
    "what's standard shipping for a replacement, and who do I email?"
)

SEARCH_FOR = {
    "refund": "Acme refund return window payment method ORD-*",
    "shipping": "Acme standard shipping delivery time ORD-*",
    "contacts": "Acme support email help@ contact VIP phone ORD-*",
}

ROLE = {
    "refund": "refund worker — return window, payment method, partial refunds only",
    "shipping": "shipping worker — ETA, express vs standard only",
    "contacts": "contacts worker — support email, VIP phone, hours only",
}


class State(TypedDict):
    question: str
    # Parallel nodes each return {"findings": [one brief]}.
    # Without Annotated[..., add], the last writer would overwrite the others.
    findings: Annotated[list[str], add]
    citations: Annotated[list[str], add]
    answer: str
    log: Annotated[list[str], add]


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


STORES = {
    "refund": ingest_corpus([DATA / "refund_policy.txt"], "refund"),
    "shipping": ingest_corpus([DATA / "shipping_policy.txt"], "shipping"),
    "contacts": ingest_corpus([DATA / "contacts.txt"], "contacts"),
}
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
print("ingest Acme corpora · parallel refund / shipping / contacts ready")


def _worker(job: str, state: State) -> dict:
    hits = STORES[job].similarity_search(SEARCH_FOR[job], k=TOP_K)
    sources = sorted({h.metadata["source"] for h in hits}) if hits else []
    context = (
        "\n\n".join(f"[{h.metadata['source']}] {h.page_content}" for h in hits)
        if hits
        else "(empty)"
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are the Acme {role}. Write ONE short internal brief "
                "(2–4 sentences). Facts only from context. If empty: {fallback}"
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nContext:\n{context}"
            ),
        ]
    )
    brief = (prompt | MODEL).invoke(
        {
            "role": ROLE[job],
            "fallback": FALLBACK,
            "question": state["question"],
            "context": context,
        }
    ).content
    line = f"[{job}] {brief}"
    return {
        "findings": [line],
        "citations": sources,
        "log": [f"{job}_worker · sources={sources}"],
    }


def refund_worker(state: State) -> dict:
    return _worker("refund", state)


def shipping_worker(state: State) -> dict:
    return _worker("shipping", state)


def contacts_worker(state: State) -> dict:
    return _worker("contacts", state)


def summarize(state: State) -> dict:
    """Join node — runs once after ALL parallel workers finish."""
    packet = "\n\n".join(state["findings"]) or "(no findings)"
    sources = sorted(set(state.get("citations") or []))
    allowed = ", ".join(sources) or "(none)"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme support. Merge the parallel worker briefs into ONE "
                "customer reply. Use only those briefs. End with Sources: using "
                f"filenames from: {allowed}"
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nWorker briefs:\n{packet}"
            ),
        ]
    )
    answer = (prompt | MODEL).invoke(
        {"question": state["question"], "packet": packet}
    ).content
    return {
        "answer": answer,
        "log": [f"summarize · joined {len(state['findings'])} briefs · sources={sources}"],
    }


graph = StateGraph(State)
graph.add_node("refund_worker", refund_worker)
graph.add_node("shipping_worker", shipping_worker)
graph.add_node("contacts_worker", contacts_worker)
graph.add_node("summarize", summarize)

# Fan-out: three edges leave START together.
graph.add_edge(START, "refund_worker")
graph.add_edge(START, "shipping_worker")
graph.add_edge(START, "contacts_worker")
# Join: summarize waits until every inbound branch has finished.
graph.add_edge("refund_worker", "summarize")
graph.add_edge("shipping_worker", "summarize")
graph.add_edge("contacts_worker", "summarize")
graph.add_edge("summarize", END)
app = graph.compile()

print("=" * 60)
print("09 — Parallel agents (Acme)")
print("START ⇉ refund | shipping | contacts → summarize → END")
print("=" * 60)
print(f"\nticket: {TICKET}")

result = app.invoke(
    {
        "question": TICKET,
        "findings": [],
        "citations": [],
        "answer": "",
        "log": [],
    }
)

print("\nfindings (reducer-merged):")
for line in result["findings"]:
    print(f"  · {line[:120]}{'…' if len(line) > 120 else ''}")

print("\nlog:")
for line in result["log"]:
    print(f"  · {line}")

print(f"\nanswer:\n{result['answer']}")
print("\n" + "=" * 60)
print("Join waits for every branch — fast worker does not start summarize early.")
print("Vs 10: use sequential when B needs A's output.")
print("=" * 60)
