# 02 — Worker agents (Acme order-support)
#
# Focused sub-agents that handle ONE type of subtask.
# Supervisors (01) decide *who*; this file zooms into the workers themselves:
# narrow corpus, narrow prompt, unit-testable.
#
#   ticket → plan_jobs (LLM: ordered job list) →
#     execute_job loop (refund | shipping | contacts worker) →
#   gather (stack briefs + citations)
#
# Same Day 2 Acme corpus. Each worker may only read its own index.
#
# Vs 01 supervisor: 01 merges into a customer reply; 02 stops at worker briefs.
# Vs 05 specialist: workers are task-shaped (refund/shipping/contacts);
#   specialists are domain-shaped (legal/finance/code).
# When: you know the job list and need reliable small units.
# Skip when: one generalist finishes the ticket without handoffs.
#
# Demo tickets (expected jobs):
#   "Can I return ORD-88421 and get money back to my card?"
#       → [refund]
#   "How long does standard shipping take for ORD-88421?"
#       → [shipping]
#   "Refund window for ORD-88421, and who do I email?"
#       → [refund, contacts]

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

Job = Literal["refund", "shipping", "contacts"]

TICKETS = [
    "Can I return ORD-88421 and get money back to my card?",
    "How long does standard shipping take for ORD-88421?",
    "Refund window for ORD-88421, and who do I email?",
]


class JobPlan(BaseModel):
    """Which narrow workers to run, in order."""

    jobs: list[Job] = Field(
        description=(
            "Ordered worker jobs. "
            "refund = return / refund / payment method; "
            "shipping = delivery / ETA / tracking; "
            "contacts = who to email / phone / VIP desk. "
            "Use one or more; do not invent other job names."
        )
    )
    why: str = Field(description="One short sentence for the audit log")


class State(TypedDict):
    question: str
    jobs: list[str]
    why: str
    job_index: int
    results: list[str]
    citations: list[str]
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


refund_store = ingest_corpus([DATA / "refund_policy.txt"], "refund")
shipping_store = ingest_corpus([DATA / "shipping_policy.txt"], "shipping")
contacts_store = ingest_corpus([DATA / "contacts.txt"], "contacts")

STORES: dict[str, InMemoryVectorStore] = {
    "refund": refund_store,
    "shipping": shipping_store,
    "contacts": contacts_store,
}

WORKER_ROLE = {
    "refund": "refund worker — return window, payment method, partial refunds only",
    "shipping": "shipping worker — ETA, express vs standard, tracking only",
    "contacts": "contacts worker — support email, VIP phone, store hours only",
}

# Narrow retrieve string so a multi-part ticket does not starve the contacts index.
SEARCH_FOR_JOB = {
    "refund": "Acme refund return window payment method ORD-*",
    "shipping": "Acme standard shipping delivery time ORD-*",
    "contacts": "Acme support email help@ contact VIP phone ORD-*",
}

MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
PLANNER = MODEL.with_structured_output(JobPlan)
print(f"ingest refund + shipping + contacts · worker desk ready · {len(TICKETS)} tickets")


def run_worker(job: str, question: str) -> tuple[str, list[str]]:
    """One narrow worker: own index + own prompt. No cross-corpus peeking."""
    store = STORES[job]
    search_q = SEARCH_FOR_JOB[job]
    hits = store.similarity_search(search_q, k=TOP_K)
    if not hits:
        return f"[{job}] {FALLBACK}", []

    sources = sorted({h.metadata["source"] for h in hits})
    context = "\n\n".join(
        f"[{h.metadata['source']}] {h.page_content}" for h in hits
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are the Acme {role}. "
                "Write a short internal brief (2–4 sentences) for the desk. "
                "Use ONLY this worker's context. If missing, reply exactly: "
                + FALLBACK
                + "\nDo not invent fees, portals, or phone numbers.\n\n"
                "Context:\n{context}"
            ),
            HumanMessagePromptTemplate.from_template(
                "Original ticket:\n{question}\n\n"
                "Answer only the part this worker owns."
            ),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {
            "role": WORKER_ROLE[job],
            "context": context,
            "question": question,
        }
    )
    return f"[{job}] {reply.content}", sources


def plan_jobs(state: State) -> dict:
    """Map ticket → ordered list of narrow worker jobs."""
    log = list(state.get("log") or [])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You plan Acme support jobs for narrow workers. "
                "Return only the jobs needed, in a sensible order.\n"
                "- refund: return / refund / money back / payment method\n"
                "- shipping: delivery time / shipping / tracking\n"
                "- contacts: who to email / phone / VIP desk\n"
                "Prefer the smallest job list that covers the ticket."
            ),
            HumanMessagePromptTemplate.from_template("Ticket:\n{question}"),
        ]
    )
    plan: JobPlan = (prompt | PLANNER).invoke({"question": state["question"]})
    jobs = list(plan.jobs) or ["refund"]
    log.append(f"plan_jobs → {jobs} · {plan.why}")
    return {
        "jobs": jobs,
        "why": plan.why,
        "job_index": 0,
        "results": [],
        "citations": [],
        "log": log,
    }


def execute_job(state: State) -> dict:
    """Run exactly one worker for jobs[job_index]."""
    jobs = state["jobs"]
    i = state["job_index"]
    job = jobs[i]
    brief, sources = run_worker(job, state["question"])

    results = list(state.get("results") or [])
    results.append(brief)
    prior = list(state.get("citations") or [])
    citations = list(dict.fromkeys(prior + sources))
    log = list(state["log"])
    log.append(f"execute_job[{i}]={job} · sources={sources}")

    return {
        "results": results,
        "citations": citations,
        "job_index": i + 1,
        "log": log,
    }


def after_job(state: State) -> str:
    if state["job_index"] < len(state["jobs"]):
        return "execute_job"
    return "gather"


def gather(state: State) -> dict:
    """Stack worker briefs — customer synthesize stays in 01."""
    log = list(state["log"])
    citations = state.get("citations") or []
    log.append(f"gather · {len(state['results'])} briefs · citations={citations}")
    return {"log": log}


graph = StateGraph(State)
graph.add_node("plan_jobs", plan_jobs)
graph.add_node("execute_job", execute_job)
graph.add_node("gather", gather)

graph.add_edge(START, "plan_jobs")
graph.add_edge("plan_jobs", "execute_job")
graph.add_conditional_edges(
    "execute_job",
    after_job,
    {
        "execute_job": "execute_job",
        "gather": "gather",
    },
)
graph.add_edge("gather", END)
app = graph.compile()

print("=" * 60)
print("02 — Worker agents (Acme)")
print("plan_jobs → execute_job* → gather")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "jobs": [],
            "why": "",
            "job_index": 0,
            "results": [],
            "citations": [],
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print("  briefs:")
    for brief in result["results"]:
        print(f"    → {brief}")

print("\n" + "=" * 60)
print("Workers own one corpus each. 01 synthesizes customer answers.")
print("=" * 60)
