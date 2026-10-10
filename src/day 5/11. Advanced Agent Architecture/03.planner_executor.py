# 03 — Planner / executor (Acme order-support)
#
# Separate planning from doing:
#   1) Planner  → structured step list (what to do)
#   2) Executor → run each step (retrieve / draft)
#   3) Replan once if a retrieve step returns empty (bounded)
#
# Stops a blind tool loop from burning tokens on multi-step tickets.
#
# Same Day 2 Acme corpus as 01 / 02.
#
# Vs 01 supervisor: supervisor picks *who* (workers); planner picks *what steps*.
# Vs 02 workers: 02 plans worker *roles*; 03 plans *operations* then executes them.
# Vs 10 sequential: sequential stages are fixed; planner invents the plan per ticket.
# When: multi-step support tickets, research reports, multi-tool workflows.
# Skip when: one retrieve + answer is enough.
#
# Demo tickets (expected plan shape):
#   "Can I return ORD-88421 and get money back to my card?"
#       → lookup_refund → draft_reply
#   "How long does standard shipping take for ORD-88421?"
#       → lookup_shipping → draft_reply
#   "If I return ORD-88421, how long until the refund hits, and who do I email?"
#       → lookup_refund → lookup_contacts → draft_reply

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

load_dotenv()

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
TOP_K = 3
MAX_REPLANS = 1
# Keep this distinct from a good contacts brief (which may mention help@acme.example).
FALLBACK = "I don't have policy context for that."

Step = Literal[
    "lookup_refund",
    "lookup_shipping",
    "lookup_contacts",
    "draft_reply",
]

TICKETS = [
    "Can I return ORD-88421 and get money back to my card?",
    "How long does standard shipping take for ORD-88421?",
    "If I return ORD-88421, how long until the refund hits my card, and who do I email?",
]


class SupportPlan(BaseModel):
    """Ordered operations for the executor — not worker names."""

    steps: list[Step] = Field(
        description=(
            "Ordered steps. "
            "lookup_refund / lookup_shipping / lookup_contacts = retrieve that policy. "
            "draft_reply = write the customer answer from notes so far (always last). "
            "Include only the lookups the ticket needs, then draft_reply."
        )
    )
    why: str = Field(description="One short sentence for the audit log")


class State(TypedDict):
    question: str
    plan: list[str]
    why: str
    step_index: int
    notes: list[str]
    citations: list[str]
    answer: str
    replans: int
    last_step_ok: bool
    log: list[str]


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
    "lookup_refund": ingest_corpus([DATA / "refund_policy.txt"], "refund"),
    "lookup_shipping": ingest_corpus([DATA / "shipping_policy.txt"], "shipping"),
    "lookup_contacts": ingest_corpus([DATA / "contacts.txt"], "contacts"),
}

SEARCH_FOR_STEP = {
    "lookup_refund": "Acme refund return window payment method ORD-*",
    "lookup_shipping": "Acme standard shipping delivery time ORD-*",
    "lookup_contacts": "Acme support email help@ contact VIP phone ORD-*",
}

MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
PLANNER = MODEL.with_structured_output(SupportPlan)
print(f"ingest refund + shipping + contacts · planner/executor ready · {len(TICKETS)} tickets")


def run_lookup(step: str, question: str) -> tuple[str, list[str], bool]:
    store = STORES[step]
    hits = store.similarity_search(SEARCH_FOR_STEP[step], k=TOP_K)
    if not hits:
        return f"[{step}] empty", [], False

    sources = sorted({h.metadata["source"] for h in hits})
    context = "\n\n".join(
        f"[{h.metadata['source']}] {h.page_content}" for h in hits
    )
    focus = {
        "lookup_refund": "Extract refund / return / payment timing facts only.",
        "lookup_shipping": "Extract shipping / delivery ETA facts only.",
        "lookup_contacts": "Extract support email / phone / hours only.",
    }[step]
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You extract notes for an Acme support plan executor. "
                f"{focus} "
                "2–3 sentences from context only. If *this* focus is missing, reply exactly: "
                + FALLBACK
                + "\n\nContext:\n{context}"
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nIgnore parts of the ticket outside your focus."
            ),
        ]
    )
    reply = (prompt | MODEL).invoke({"context": context, "question": question})
    text = reply.content.strip()
    # Retrieve succeeded if we have sources. Weak notes still go to draft_reply.
    ok = bool(sources)
    return f"[{step}] {text}", sources, ok


def run_draft(question: str, notes: list[str], citations: list[str]) -> str:
    blob = "\n\n".join(notes) if notes else "(no notes)"
    sources_line = ", ".join(citations) if citations else "(none)"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme order support. Merge the executor notes into ONE customer reply. "
                "Use every usable note. Skip any note that is exactly '"
                + FALLBACK
                + "'. "
                "Only if no usable notes remain, reply with that fallback.\n"
                "Do not invent fees or portals.\n"
                "End with exactly:\nSources: {sources_line}\n\n"
                "Notes:\n{notes}"
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {
            "notes": blob,
            "question": question,
            "sources_line": sources_line,
        }
    )
    return reply.content


def planner(state: State) -> dict:
    log = list(state.get("log") or [])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You plan Acme support *operations* (not worker names).\n"
                "- lookup_refund: return / refund / payment timing\n"
                "- lookup_shipping: delivery ETA / shipping\n"
                "- lookup_contacts: who to email / phone\n"
                "- draft_reply: always the last step\n"
                "Prefer the smallest plan that covers the ticket."
            ),
            HumanMessagePromptTemplate.from_template("Ticket:\n{question}"),
        ]
    )
    plan: SupportPlan = (prompt | PLANNER).invoke({"question": state["question"]})
    steps = list(plan.steps)
    if not steps or steps[-1] != "draft_reply":
        steps = [s for s in steps if s != "draft_reply"] + ["draft_reply"]
    if not any(s.startswith("lookup_") for s in steps):
        steps = ["lookup_refund", "draft_reply"]

    log.append(f"planner → {steps} · {plan.why}")
    return {
        "plan": steps,
        "why": plan.why,
        "step_index": 0,
        "notes": [],
        "citations": [],
        "answer": "",
        "last_step_ok": True,
        "log": log,
    }


def executor(state: State) -> dict:
    plan = state["plan"]
    i = state["step_index"]
    step = plan[i]
    log = list(state["log"])
    notes = list(state.get("notes") or [])
    citations = list(state.get("citations") or [])

    if step == "draft_reply":
        answer = run_draft(state["question"], notes, citations)
        log.append(f"executor[{i}]=draft_reply · citations={citations}")
        return {
            "answer": answer,
            "step_index": i + 1,
            "last_step_ok": True,
            "log": log,
        }

    note, sources, ok = run_lookup(step, state["question"])
    notes.append(note)
    citations = list(dict.fromkeys(citations + sources))
    log.append(f"executor[{i}]={step} · ok={ok} · sources={sources}")
    return {
        "notes": notes,
        "citations": citations,
        "step_index": i + 1,
        "last_step_ok": ok,
        "log": log,
    }


def after_executor(state: State) -> str:
    plan = state["plan"]
    i = state["step_index"]

    # Failed lookup with replan budget → rebuild plan once.
    if (
        not state.get("last_step_ok", True)
        and state.get("replans", 0) < MAX_REPLANS
        and i > 0
        and plan[i - 1].startswith("lookup_")
    ):
        return "replan"

    if i >= len(plan):
        return "done"
    return "executor"


def replan(state: State) -> dict:
    """Bounded corrective plan after a failed lookup (MAX_REPLANS)."""
    replans = state.get("replans", 0) + 1
    log = list(state["log"])
    failed = state["plan"][state["step_index"] - 1] if state["step_index"] else "?"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "A support plan step failed (empty / unusable retrieve). "
                "Propose a revised step list. Always end with draft_reply. "
                "Avoid repeating only the failed step if another lookup can help.\n"
                f"Failed step: {failed}\nPrior plan: {state['plan']}"
            ),
            HumanMessagePromptTemplate.from_template("Ticket:\n{question}"),
        ]
    )
    revised: SupportPlan = (prompt | PLANNER).invoke({"question": state["question"]})
    steps = list(revised.steps)
    if not steps or steps[-1] != "draft_reply":
        steps = [s for s in steps if s != "draft_reply"] + ["draft_reply"]

    log.append(f"replan#{replans} → {steps} · {revised.why}")
    return {
        "plan": steps,
        "step_index": 0,
        "notes": [],
        "citations": [],
        "answer": "",
        "replans": replans,
        "last_step_ok": True,
        "log": log,
    }


graph = StateGraph(State)
graph.add_node("planner", planner)
graph.add_node("executor", executor)
graph.add_node("replan", replan)

graph.add_edge(START, "planner")
graph.add_edge("planner", "executor")
graph.add_conditional_edges(
    "executor",
    after_executor,
    {
        "executor": "executor",
        "replan": "replan",
        "done": END,
    },
)
graph.add_edge("replan", "executor")
app = graph.compile()

print("=" * 60)
print("03 — Planner / executor (Acme)")
print("planner → executor* → [replan → executor* | done]")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "plan": [],
            "why": "",
            "step_index": 0,
            "notes": [],
            "citations": [],
            "answer": "",
            "replans": 0,
            "last_step_ok": True,
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  answer: {result['answer']}")

print("\n" + "=" * 60)
print("Plan the steps. Execute them. Replan at most once on empty lookup.")
print("=" * 60)
