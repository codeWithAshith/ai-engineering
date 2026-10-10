# 11 — Agent handoffs (Acme order-support)
#
# Pass control + context from one agent to another mid-thread.
# Carry: messages slice, active_agent, handoff_reason, structured ticket.
#
#   thread → triage (LLM: support | compliance) →
#     support    (Day 2 policy RAG)
#     compliance (boundary + escalate contacts)
#   → END
#
# Same Day 2 Acme corpus for support. Compliance refuses to give legal advice.
#
# Vs 04 router: router chooses once up front; handoff fires when the *last*
#   turn changes domain (e.g. refund thread → “is it legal…”).
# Day 1 link: human-in-the-loop is a handoff to a person.
# When: long conversations that change domain mid-flight.
# Skip when: every ticket is single-shot classify → answer (04 is enough).
#
# Demo threads:
#   refund FAQ → support / priority=normal
#   prior support turn + legal ask → compliance / priority=high

from __future__ import annotations

import re
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
FALLBACK = "I don't have policy context for that. Email help@acme.example."
ORDER_RE = re.compile(r"ORD-\d+", re.I)

Agent = Literal["support", "compliance"]

# Mid-thread: support already answered; last turn asks for legal advice.
THREADS: list[dict] = [
    {
        "label": "support · refund",
        "messages": [
            "User: Can I return ORD-88421 and get money back to my card?",
        ],
    },
    {
        "label": "handoff · legal mid-thread",
        "messages": [
            "User: Can I return ORD-88421 and get money back to my card?",
            "Support: Yes — request within 45 days with the receipt; approved "
            "refunds hit the original payment method in 5–7 business days. "
            "Sources: refund_policy.txt",
            "User: Is it legal for Acme to refuse my refund after 50 days? "
            "I need legal advice about my contract.",
        ],
    },
]


class HandoffDecision(BaseModel):
    """Who owns the *latest* user turn — may differ from earlier turns."""

    active_agent: Agent = Field(
        description=(
            "support = refund / shipping / contacts / how-to FAQ; "
            "compliance = legal rights, 'is it legal', contract advice, "
            "refuse/deny disputes — hand off with a not-legal-advice boundary"
        )
    )
    handoff_reason: str = Field(
        description="Empty if staying on support; else why control moves"
    )
    priority: Literal["normal", "high"] = Field(
        description="high for compliance / legal escalation"
    )
    category: Literal["faq", "legal"] = Field(
        description="faq for support; legal for compliance"
    )


class State(TypedDict):
    messages: list[str]
    active_agent: str
    handoff_reason: str
    ticket: dict
    citations: list[str]
    log: list[str]


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
TRIAGE = MODEL.with_structured_output(HandoffDecision)
print("ingest flat Acme policies · triage + support + compliance ready")


def _last_user(messages: list[str]) -> str:
    for line in reversed(messages):
        if line.lower().startswith("user:"):
            return line.split(":", 1)[-1].strip()
    return messages[-1] if messages else ""


def _order_id(text: str) -> str:
    m = ORDER_RE.search(text)
    return m.group(0).upper() if m else ""


def triage(state: State) -> dict:
    """Decide who owns the latest turn; stamp ticket metadata for ops."""
    log = list(state.get("log") or [])
    last = _last_user(state["messages"])
    thread = "\n".join(state["messages"])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme triage for agent handoffs.\n"
                "Read the FULL thread, but route on the LATEST user turn.\n"
                "If the latest turn needs legal/compliance, hand off even when "
                "earlier turns were refund FAQ.\n"
                "Do not answer the customer."
            ),
            HumanMessagePromptTemplate.from_template("Thread:\n{thread}"),
        ]
    )
    decision: HandoffDecision = (prompt | TRIAGE).invoke({"thread": thread})
    ticket = {
        "priority": decision.priority,
        "category": decision.category,
        "order_id": _order_id(thread),
    }
    log.append(
        f"triage · active_agent={decision.active_agent} · "
        f"reason={decision.handoff_reason!r} · ticket={ticket}"
    )
    return {
        "active_agent": decision.active_agent,
        "handoff_reason": decision.handoff_reason,
        "ticket": ticket,
        "log": log,
    }


def support_agent(state: State) -> dict:
    log = list(state["log"])
    question = _last_user(state["messages"])
    hits = store.similarity_search(question, k=TOP_K)
    sources = sorted({h.metadata["source"] for h in hits}) if hits else []
    context = (
        "\n\n".join(f"[{h.metadata['source']}] {h.page_content}" for h in hits)
        if hits
        else "(empty)"
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme support. Answer ONLY from policy context.\n"
                "Do not invent portals or legal opinions. End with Sources: "
                "using real filenames. If empty: " + FALLBACK
            ),
            HumanMessagePromptTemplate.from_template(
                "Latest question:\n{question}\n\nPolicy context:\n{context}"
            ),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {"question": question, "context": context}
    ).content
    line = f"Support: {reply}"
    log.append(f"support · sources={sources}")
    return {
        "messages": state["messages"] + [line],
        "citations": sources,
        "log": log,
    }


def compliance_agent(state: State) -> dict:
    """Handoff target — boundary + escalate, not legal advice."""
    log = list(state["log"])
    question = _last_user(state["messages"])
    hits = store.similarity_search(question, k=TOP_K)
    sources = sorted({h.metadata["source"] for h in hits}) if hits else []
    # Always include contacts for escalation path.
    if "contacts.txt" not in sources:
        sources = sorted(set(sources) | {"contacts.txt"})
    context = (
        "\n\n".join(f"[{h.metadata['source']}] {h.page_content}" for h in hits)
        if hits
        else "(empty)"
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme compliance. You received a handoff.\n"
                "Handoff reason: {handoff_reason}\n"
                "Ticket: {ticket}\n"
                "State policy facts from context ONLY.\n"
                "ALWAYS say this is general information, not legal advice.\n"
                "Point disputes to help@acme.example. Do not invent counsel.\n"
                "End with Sources: listing real filenames."
            ),
            HumanMessagePromptTemplate.from_template(
                "Latest question:\n{question}\n\nPolicy context:\n{context}"
            ),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {
            "handoff_reason": state["handoff_reason"],
            "ticket": str(state["ticket"]),
            "question": question,
            "context": context,
        }
    ).content
    line = f"Compliance (handoff: {state['handoff_reason']}): {reply}"
    log.append(f"compliance · sources={sources}")
    return {
        "messages": state["messages"] + [line],
        "citations": sources,
        "log": log,
    }


def route(state: State) -> str:
    return state["active_agent"]


graph = StateGraph(State)
graph.add_node("triage", triage)
graph.add_node("support", support_agent)
graph.add_node("compliance", compliance_agent)

graph.add_edge(START, "triage")
graph.add_conditional_edges(
    "triage",
    route,
    {"support": "support", "compliance": "compliance"},
)
graph.add_edge("support", END)
graph.add_edge("compliance", END)
app = graph.compile()

print("=" * 60)
print("11 — Agent handoffs (Acme)")
print("triage → support | compliance  (route on latest turn)")
print("=" * 60)

for case in THREADS:
    print(f"\ncase: {case['label']}")
    for m in case["messages"]:
        print(f"  {m[:100]}{'…' if len(m) > 100 else ''}")
    result = app.invoke(
        {
            "messages": list(case["messages"]),
            "active_agent": "",
            "handoff_reason": "",
            "ticket": {},
            "citations": [],
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  active_agent={result['active_agent']} ticket={result['ticket']}")
    print(f"  last: {result['messages'][-1][:160]}{'…' if len(result['messages'][-1]) > 160 else ''}")

print("\n" + "=" * 60)
print("Vs 04: router is one-shot up front; handoff re-checks the latest turn.")
print("Always log active_agent + handoff_reason (see 13).")
print("=" * 60)
