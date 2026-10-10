# 06 — Critic agents (Acme order-support)
#
# Quality gate before the customer sees the reply:
#   ticket → generate (RAG draft) → critic (LLM review) →
#     approved → finalize
#     issues + budget → revise → critic again (bounded)
#
# Same Day 2 Acme corpus. Critic checks grounding, invention, Sources line.
#
# Vs 07 evaluator: critic writes feedback and drives a rewrite; evaluator
#   emits scores for monitoring / CI (no edit loop).
# When: user-facing drafts, compliance copy, high-stakes replies.
# Skip when: output is already schema-validated by code.
#
# Demo tickets:
#   "Can I return ORD-88421 and get money back to my card?"
#   "How long does standard shipping take for ORD-88421?"
#   "Who do I email about ORD-88421?"

from __future__ import annotations

from pathlib import Path
from typing import TypedDict

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
MAX_REVISIONS = 1
FALLBACK = "I don't have policy context for that."

TICKETS = [
    "Can I return ORD-88421 and get money back to my card?",
    "How long does standard shipping take for ORD-88421?",
    "Who do I email about ORD-88421?",
]


class Critique(BaseModel):
    """Structured critic output — drives revise vs approve."""

    approved: bool = Field(description="True only if the draft is safe to send")
    issues: list[str] = Field(
        description=(
            "Concrete problems, e.g. invents portal/URL, missing Sources, "
            "ungrounded timeline, vague filler. Empty if approved."
        )
    )
    guidance: str = Field(
        description="One short instruction for the reviser (or 'ok to send')"
    )


class State(TypedDict):
    question: str
    context: str
    citations: list[str]
    draft: str
    critique: str
    approved: bool
    revisions: int
    final: str
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
CRITIC = MODEL.with_structured_output(Critique)
print(f"ingest flat Acme policies · critic desk ready · {len(TICKETS)} tickets")


def generate(state: State) -> dict:
    """
    First draft is intentionally a bit loose (mentions a 'portal') so the
    critic has something real to catch — production generators can be tighter.
    """
    log = list(state.get("log") or [])
    hits = store.similarity_search(state["question"], k=TOP_K)
    if not hits:
        log.append("generate · empty retrieve → fallback draft")
        return {
            "context": "",
            "citations": [],
            "draft": FALLBACK,
            "log": log,
        }

    sources = sorted({h.metadata["source"] for h in hits})
    context = "\n\n".join(
        f"[{h.metadata['source']}] {h.page_content}" for h in hits
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme order support drafting a FIRST reply.\n"
                "Use the context. Be helpful and concise.\n"
                "You may mention the Acme refund portal if it seems useful "
                "(even if the context does not name a portal).\n"
                "Context:\n{context}"
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {"context": context, "question": state["question"]}
    )
    log.append(f"generate · sources={sources}")
    return {
        "context": context,
        "citations": sources,
        "draft": reply.content,
        "revisions": 0,
        "log": log,
    }


def critic(state: State) -> dict:
    log = list(state["log"])
    sources_line = ", ".join(state.get("citations") or []) or "(none)"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are an Acme QA critic. Approve only if ALL pass:\n"
                "1) Every concrete claim appears in the policy context\n"
                "2) No invented portals, URLs, fees, or phone numbers\n"
                "3) Reply ends with a Sources line using real filenames "
                f"(expected files: {sources_line})\n"
                "4) Not vague filler ('soon', 'important', 'we care')\n"
                "If the draft is exactly the fallback with no invention, approve it."
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\n"
                "Policy context:\n{context}\n\n"
                "Draft:\n{draft}"
            ),
        ]
    )
    result: Critique = (prompt | CRITIC).invoke(
        {
            "question": state["question"],
            "context": state.get("context") or "(empty)",
            "draft": state["draft"],
        }
    )
    critique = result.guidance
    if result.issues:
        critique = "Issues: " + "; ".join(result.issues) + f" · {result.guidance}"
    log.append(f"critic · approved={result.approved} · {critique}")
    return {
        "approved": result.approved,
        "critique": critique,
        "log": log,
    }


def after_critic(state: State) -> str:
    if state["approved"]:
        return "finalize"
    if state.get("revisions", 0) < MAX_REVISIONS:
        return "revise"
    return "finalize"


def revise(state: State) -> dict:
    log = list(state["log"])
    revisions = state.get("revisions", 0) + 1
    sources_line = ", ".join(state.get("citations") or []) or "(none)"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme order support revising a draft after QA.\n"
                "Fix every critic issue. Use ONLY the policy context.\n"
                "Do not invent portals, URLs, or fees.\n"
                "End with exactly:\nSources: {sources_line}\n\n"
                "Context:\n{context}\n\n"
                "Critic:\n{critique}"
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nPrior draft:\n{draft}"
            ),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {
            "context": state.get("context") or "(empty)",
            "critique": state["critique"],
            "question": state["question"],
            "draft": state["draft"],
            "sources_line": sources_line,
        }
    )
    log.append(f"revise#{revisions}")
    return {
        "draft": reply.content,
        "revisions": revisions,
        "approved": False,
        "log": log,
    }


def finalize(state: State) -> dict:
    log = list(state["log"])
    log.append("finalize · send draft")
    return {"final": state["draft"], "log": log}


graph = StateGraph(State)
graph.add_node("generate", generate)
graph.add_node("critic", critic)
graph.add_node("revise", revise)
graph.add_node("finalize", finalize)

graph.add_edge(START, "generate")
graph.add_edge("generate", "critic")
graph.add_conditional_edges(
    "critic",
    after_critic,
    {
        "revise": "revise",
        "finalize": "finalize",
    },
)
graph.add_edge("revise", "critic")
graph.add_edge("finalize", END)
app = graph.compile()

print("=" * 60)
print("06 — Critic agents (Acme)")
print("generate → critic → [revise → critic]* → finalize")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "context": "",
            "citations": [],
            "draft": "",
            "critique": "",
            "approved": False,
            "revisions": 0,
            "final": "",
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  draft→final: {result['final']}")

print("\n" + "=" * 60)
print("Critic gates the draft. Evaluator (07) only scores.")
print("=" * 60)
