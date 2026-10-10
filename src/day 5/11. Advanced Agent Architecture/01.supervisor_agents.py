# 01 — Supervisor agents (Acme order-support)
#
# Production pattern: a lead agent does NOT answer the ticket alone.
# It assigns specialist workers, waits for their briefs, then synthesizes
# one grounded customer reply (+ citations).
#
#   ticket → supervisor (LLM assign) →
#     policy_worker   (refund / shipping RAG brief)
#     contacts_worker (help desk RAG brief)
#     or both (policy then contacts)
#   → synthesize (LLM merge) → answer
#
# Same Acme corpus as Day 2 RAG / Day 3 Advanced RAG.
#
# Vs 04 router: router ends at one specialist answer; supervisor merges.
# Vs 08 hierarchy: this file is one supervisor level; 08 stacks team leads.
# When: tickets that need different skills, then one final answer.
# Skip when: a single specialist path is enough (use 04 / 05).
#
# Demo tickets (expected path):
#   "Can I return ORD-88421 and get money back to my card?"
#       → policy → synthesize
#   "Who do I email about ORD-88421?"
#       → contacts → synthesize
#   "If I return ORD-88421, how long until the refund hits, and who do I email?"
#       → both → synthesize

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
FALLBACK = "I don't have policy context for that. Email help@acme.example."

TICKETS = [
    "Can I return ORD-88421 and get money back to my card?",
    "Who do I email about ORD-88421?",
    "If I return ORD-88421, how long until the refund hits my card, and who do I email?",
]

Assignment = Literal["policy", "contacts", "both"]


class SupervisorDecision(BaseModel):
    """Lead agent assigns work — does not write the customer answer here."""

    assignment: Assignment = Field(
        description=(
            "policy = refund / return / shipping / payment timing only; "
            "contacts = who to email / phone / VIP desk only; "
            "both = needs policy facts AND a contact channel in one reply"
        )
    )
    why: str = Field(description="One short sentence for the audit log")


class State(TypedDict):
    question: str
    assignment: str
    why: str
    policy_brief: str
    contacts_brief: str
    citations: list[str]
    answer: str
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


policies = ingest_corpus(
    [DATA / "refund_policy.txt", DATA / "shipping_policy.txt"],
    "policies",
)
contacts = ingest_corpus([DATA / "contacts.txt"], "contacts")
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
SUPERVISOR = MODEL.with_structured_output(SupervisorDecision)
print(
    f"ingest policies + contacts · supervisor desk ready · {len(TICKETS)} tickets"
)


def retrieve_brief(
    store: InMemoryVectorStore,
    question: str,
    worker_name: str,
) -> tuple[str, list[str]]:
    """Worker retrieve → grounded brief. Empty hits → explicit fallback."""
    hits = store.similarity_search(question, k=TOP_K)
    if not hits:
        return FALLBACK, []

    sources = sorted({h.metadata["source"] for h in hits})
    context = "\n\n".join(
        f"[{h.metadata['source']}] {h.page_content}" for h in hits
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                f"You are the Acme {worker_name}. "
                "Write a short internal brief (3–5 sentences) for the supervisor. "
                "Use ONLY the context. If the context does not say, write exactly: "
                + FALLBACK
                + "\nDo not invent fees, portals, or phone numbers.\n\n"
                "Context:\n{context}"
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    reply = (prompt | MODEL).invoke({"context": context, "question": question})
    return reply.content, sources


def supervise(state: State) -> dict:
    """Lead node — LLM assigns workers; edge only reads assignment."""
    log = list(state.get("log") or [])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are the Acme order-support SUPERVISOR. "
                "Assign work to specialist workers. Do not answer the customer yet.\n"
                "- policy: refund window, return, payment method, shipping timing\n"
                "- contacts: support email, VIP phone, store hours\n"
                "- both: ticket clearly needs policy facts AND who to contact\n"
                "Prefer both when the ticket asks refund/return timing AND email/who."
            ),
            HumanMessagePromptTemplate.from_template("Ticket:\n{question}"),
        ]
    )
    decision: SupervisorDecision = (prompt | SUPERVISOR).invoke(
        {"question": state["question"]}
    )
    log.append(f"supervise → {decision.assignment} · {decision.why}")
    return {
        "assignment": decision.assignment,
        "why": decision.why,
        "policy_brief": "",
        "contacts_brief": "",
        "citations": [],
        "answer": "",
        "log": log,
    }


def after_supervise(state: State) -> str:
    return state["assignment"]


def policy_worker(state: State) -> dict:
    brief, sources = retrieve_brief(policies, state["question"], "policy worker")
    prior = list(state.get("citations") or [])
    citations = list(dict.fromkeys(prior + sources))
    log = list(state["log"])
    log.append(f"policy_worker · sources={sources}")
    return {
        "policy_brief": brief,
        "citations": citations,
        "log": log,
    }


def after_policy(state: State) -> str:
    if state["assignment"] == "both":
        return "contacts_worker"
    return "synthesize"


def contacts_worker(state: State) -> dict:
    brief, sources = retrieve_brief(contacts, state["question"], "contacts worker")
    prior = list(state.get("citations") or [])
    citations = list(dict.fromkeys(prior + sources))
    log = list(state["log"])
    log.append(f"contacts_worker · sources={sources}")
    return {
        "contacts_brief": brief,
        "citations": citations,
        "log": log,
    }


def synthesize(state: State) -> dict:
    """Lead merges worker briefs into one customer-facing answer."""
    parts: list[str] = []
    if state.get("policy_brief"):
        parts.append(f"[policy_worker]\n{state['policy_brief']}")
    if state.get("contacts_brief"):
        parts.append(f"[contacts_worker]\n{state['contacts_brief']}")
    briefs = "\n\n".join(parts) if parts else "(no worker briefs)"
    citations = state.get("citations") or []

    sources_line = ", ".join(citations) if citations else "(none)"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are the Acme order-support SUPERVISOR closing the ticket. "
                "Merge the worker briefs into ONE clear customer reply. "
                "Answer ONLY from the briefs. If briefs say the fallback, use it. "
                "Do not invent fees or portals.\n"
                "End with exactly this sources line (do not invent filenames):\n"
                "Sources: {sources_line}\n\n"
                "Worker briefs:\n{briefs}"
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {
            "briefs": briefs,
            "question": state["question"],
            "sources_line": sources_line,
        }
    )
    log = list(state["log"])
    log.append(f"synthesize · citations={citations}")
    return {
        "answer": reply.content,
        "log": log,
    }


graph = StateGraph(State)
graph.add_node("supervise", supervise)
graph.add_node("policy_worker", policy_worker)
graph.add_node("contacts_worker", contacts_worker)
graph.add_node("synthesize", synthesize)

graph.add_edge(START, "supervise")
graph.add_conditional_edges(
    "supervise",
    after_supervise,
    {
        "policy": "policy_worker",
        "contacts": "contacts_worker",
        "both": "policy_worker",
    },
)
graph.add_conditional_edges(
    "policy_worker",
    after_policy,
    {
        "contacts_worker": "contacts_worker",
        "synthesize": "synthesize",
    },
)
graph.add_edge("contacts_worker", "synthesize")
graph.add_edge("synthesize", END)
app = graph.compile()

print("=" * 60)
print("01 — Supervisor agents (Acme)")
print("supervise → [policy | contacts | both] → synthesize")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "assignment": "",
            "why": "",
            "policy_brief": "",
            "contacts_brief": "",
            "citations": [],
            "answer": "",
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  answer: {result['answer']}")

print("\n" + "=" * 60)
print("Supervisor assigns. Workers retrieve. Lead synthesizes.")
print("=" * 60)
