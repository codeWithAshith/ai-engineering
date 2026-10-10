# 08 — Hierarchical agents (Acme order-support)
#
# Tree of supervisors (multi-level delegation):
#   Level 0: executive — picks the owning team
#   Level 1: support_lead / eng_lead — answer (workers folded into leads)
#
#   ticket → executive (LLM team) →
#     support   (Day 2 policy RAG → faq reply)
#     engineering (oncall runbook → platform reply)
#   → END
#
# Same Acme corpus as Day 2 / Day 3 for the support team.
# Engineering uses a small runbook string (simulates a separate ops wiki).
#
# Vs 01 supervisor: one lead merges workers; here two hops of ownership.
# Vs 04 router: flat one-hop intent → agent; hierarchy adds a team layer.
# When: large orgs, clear team ownership, different corpora per team.
# Skip when: latency budgets are tight — prefer flat router + specialists (04+05).
#
# Demo tickets (expected path):
#   refund / return → support / faq_bot
#   who to email   → support / faq_bot
#   API / checkout 500 → engineering / oncall_bot

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

# Simulated engineering wiki — not in Day 2 policy files on purpose.
ENGINEERING_RUNBOOK = """
[oncall_runbook.md]
Checkout API: if customers report 5xx on /checkout, page #payments-oncall.
Known issue: retry after 30s often succeeds; do not invent SLA credits.
Status page: status.acme.example (public). Escalate product bugs to eng@acme.example.
""".strip()

TICKETS = [
    "Can I return ORD-88421 and get money back to my card?",
    "Who do I email about ORD-88421?",
    "Checkout API returns 500 for ORD-88421 — is the payments service down?",
]

Team = Literal["support", "engineering"]


class ExecutiveDecision(BaseModel):
    """Level-0 supervisor — pick the owning team, do not answer yet."""

    team: Team = Field(
        description=(
            "support = refund / return / shipping / who to email / policy FAQ; "
            "engineering = API errors, latency, outages, status page, oncall"
        )
    )
    why: str = Field(description="One short sentence for the audit log")


class State(TypedDict):
    question: str
    team: str
    why: str
    worker: str
    context: str
    citations: list[str]
    answer: str
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
EXECUTIVE = MODEL.with_structured_output(ExecutiveDecision)
print("ingest flat Acme policies · executive + team leads ready")


def executive(state: State) -> dict:
    log = list(state.get("log") or [])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme's executive triage. Assign ONE owning team.\n"
                "support owns policy FAQ (refund, shipping, contacts).\n"
                "engineering owns platform / API / outage / status questions.\n"
                "Do not write the customer answer."
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    decision: ExecutiveDecision = (prompt | EXECUTIVE).invoke(
        {"question": state["question"]}
    )
    log.append(f"executive · team={decision.team} · {decision.why}")
    return {"team": decision.team, "why": decision.why, "log": log}


def support_lead(state: State) -> dict:
    """Level-1 support — faq_bot worker folded into this node."""
    log = list(state["log"])
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
                "You are Acme support faq_bot. Answer ONLY from policy context.\n"
                "End with Sources: listing real filenames. If empty, say: "
                + FALLBACK
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nPolicy context:\n{context}"
            ),
        ]
    )
    answer = (prompt | MODEL).invoke(
        {"question": state["question"], "context": context}
    ).content
    log.append(f"support_lead · worker=faq_bot · sources={sources}")
    return {
        "worker": "faq_bot",
        "context": context,
        "citations": sources,
        "answer": answer,
        "log": log,
    }


def eng_lead(state: State) -> dict:
    """Level-1 engineering — oncall_bot worker folded into this node."""
    log = list(state["log"])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme engineering oncall_bot. Answer ONLY from the runbook.\n"
                "Do not invent SLA credits or refunds. End with Sources: oncall_runbook.md"
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nRunbook:\n{runbook}"
            ),
        ]
    )
    answer = (prompt | MODEL).invoke(
        {"question": state["question"], "runbook": ENGINEERING_RUNBOOK}
    ).content
    log.append("eng_lead · worker=oncall_bot · sources=['oncall_runbook.md']")
    return {
        "worker": "oncall_bot",
        "context": ENGINEERING_RUNBOOK,
        "citations": ["oncall_runbook.md"],
        "answer": answer,
        "log": log,
    }


def pick_team(state: State) -> str:
    return state["team"]


graph = StateGraph(State)
graph.add_node("executive", executive)
graph.add_node("support", support_lead)
graph.add_node("engineering", eng_lead)

graph.add_edge(START, "executive")
graph.add_conditional_edges(
    "executive",
    pick_team,
    {"support": "support", "engineering": "engineering"},
)
graph.add_edge("support", END)
graph.add_edge("engineering", END)
app = graph.compile()

print("=" * 60)
print("08 — Hierarchical agents (Acme)")
print("executive → support | engineering → END")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "team": "",
            "why": "",
            "worker": "",
            "context": "",
            "citations": [],
            "answer": "",
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  team={result['team']} worker={result['worker']}")
    print(f"  answer: {result['answer']}")

print("\n" + "=" * 60)
print("Vs 01: one supervisor merges workers. Here: two ownership hops.")
print("Vs 04: flat router is cheaper when teams are few.")
print("=" * 60)
