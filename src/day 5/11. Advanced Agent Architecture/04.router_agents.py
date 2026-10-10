# 04 — Router agents (Acme order-support)
#
# Classify the ticket and send it to ONE specialist path.
# Routing is the main job — no synthesis merge (unlike 01 supervisor).
#
#   ticket → router (LLM intent) →
#     refund_agent   | shipping_agent | contacts_agent | chitchat
#   → END (that agent’s answer)
#
# Same Day 2 Acme corpus. Each agent reads only its index.
#
# Vs Day 3 · 17: same shape for *retrieve strategies*; here destinations are *agents*.
# Vs 01 supervisor: router ends at the specialist; supervisor comes back to merge.
# Vs 02 / 03: those plan multiple jobs/steps; router picks a single path.
# When: clear intent buckets and independent answer paths.
# Skip when: you need multi-worker synthesis (01) or a quality gate (06 / 07).
#
# Demo tickets (expected intent):
#   "Can I return ORD-88421 and get money back to my card?" → refund
#   "How long does standard shipping take for ORD-88421?" → shipping
#   "Who do I email about ORD-88421?" → contacts
#   "thanks, that helps" → chitchat

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
FALLBACK = "I don't have policy context for that."

Intent = Literal["refund", "shipping", "contacts", "chitchat"]

TICKETS = [
    "Can I return ORD-88421 and get money back to my card?",
    "How long does standard shipping take for ORD-88421?",
    "Who do I email about ORD-88421?",
    "thanks, that helps",
]


class RouteDecision(BaseModel):
    """LLM router — pick exactly one agent path."""

    intent: Intent = Field(
        description=(
            "refund = return / refund / payment method; "
            "shipping = delivery ETA / tracking / express; "
            "contacts = who to email / phone / VIP desk; "
            "chitchat = thanks / ok / bye with no policy ask"
        )
    )
    why: str = Field(description="One short sentence for the audit log")


class State(TypedDict):
    question: str
    intent: str
    why: str
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


STORES = {
    "refund": ingest_corpus([DATA / "refund_policy.txt"], "refund"),
    "shipping": ingest_corpus([DATA / "shipping_policy.txt"], "shipping"),
    "contacts": ingest_corpus([DATA / "contacts.txt"], "contacts"),
}

SEARCH_FOR = {
    "refund": "Acme refund return window payment method ORD-*",
    "shipping": "Acme standard shipping delivery time ORD-*",
    "contacts": "Acme support email help@ contact VIP phone ORD-*",
}

AGENT_ROLE = {
    "refund": "refund desk — return window and payment method only",
    "shipping": "shipping desk — delivery ETA only",
    "contacts": "contacts desk — email / phone / hours only",
}

MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
ROUTER = MODEL.with_structured_output(RouteDecision)
print(f"ingest refund + shipping + contacts · router desk ready · {len(TICKETS)} tickets")


def grounded_answer(intent: str, question: str) -> tuple[str, list[str]]:
    """One specialist: retrieve own corpus → customer reply + Sources."""
    store = STORES[intent]
    hits = store.similarity_search(SEARCH_FOR[intent], k=TOP_K)
    if not hits:
        return FALLBACK, []

    sources = sorted({h.metadata["source"] for h in hits})
    context = "\n\n".join(
        f"[{h.metadata['source']}] {h.page_content}" for h in hits
    )
    sources_line = ", ".join(sources)
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are the Acme {role}. "
                "Answer ONLY from context. If missing, reply exactly: "
                + FALLBACK
                + "\nDo not invent fees or portals.\n"
                "End with exactly:\nSources: {sources_line}\n\n"
                "Context:\n{context}"
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {
            "role": AGENT_ROLE[intent],
            "context": context,
            "question": question,
            "sources_line": sources_line,
        }
    )
    return reply.content, sources


def router_node(state: State) -> dict:
    """Routing NODE — LLM writes intent + why. Edge only reads intent."""
    log = list(state.get("log") or [])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You route Acme order-support tickets to ONE agent.\n"
                "- refund: return / refund / money back / payment method\n"
                "- shipping: delivery time / shipping / tracking\n"
                "- contacts: who to email / phone / VIP desk\n"
                "- chitchat: thanks / ok / bye with no policy ask\n"
                "If the ticket mixes refund + email, prefer refund "
                "(multi-agent merge is lesson 01, not this router)."
            ),
            HumanMessagePromptTemplate.from_template("Ticket:\n{question}"),
        ]
    )
    decision: RouteDecision = (prompt | ROUTER).invoke(
        {"question": state["question"]}
    )
    log.append(f"router → {decision.intent} · {decision.why}")
    return {
        "intent": decision.intent,
        "why": decision.why,
        "citations": [],
        "answer": "",
        "log": log,
    }


def route_edge(state: State) -> str:
    return state["intent"]


def refund_agent(state: State) -> dict:
    answer, sources = grounded_answer("refund", state["question"])
    log = list(state["log"])
    log.append(f"refund_agent · sources={sources}")
    return {"answer": answer, "citations": sources, "log": log}


def shipping_agent(state: State) -> dict:
    answer, sources = grounded_answer("shipping", state["question"])
    log = list(state["log"])
    log.append(f"shipping_agent · sources={sources}")
    return {"answer": answer, "citations": sources, "log": log}


def contacts_agent(state: State) -> dict:
    answer, sources = grounded_answer("contacts", state["question"])
    log = list(state["log"])
    log.append(f"contacts_agent · sources={sources}")
    return {"answer": answer, "citations": sources, "log": log}


def chitchat_agent(state: State) -> dict:
    log = list(state["log"])
    log.append("chitchat_agent · no retrieve")
    return {
        "answer": "You're welcome — glad that helped.",
        "citations": [],
        "log": log,
    }


graph = StateGraph(State)
graph.add_node("router", router_node)
graph.add_node("refund", refund_agent)
graph.add_node("shipping", shipping_agent)
graph.add_node("contacts", contacts_agent)
graph.add_node("chitchat", chitchat_agent)

graph.add_edge(START, "router")
graph.add_conditional_edges(
    "router",
    route_edge,
    {
        "refund": "refund",
        "shipping": "shipping",
        "contacts": "contacts",
        "chitchat": "chitchat",
    },
)
graph.add_edge("refund", END)
graph.add_edge("shipping", END)
graph.add_edge("contacts", END)
graph.add_edge("chitchat", END)
app = graph.compile()

print("=" * 60)
print("04 — Router agents (Acme)")
print("router → [refund | shipping | contacts | chitchat] → END")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "intent": "",
            "why": "",
            "citations": [],
            "answer": "",
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    print(f"  answer: {result['answer']}")

print("\n" + "=" * 60)
print("Router picks one path. No merge — that is 01.")
print("=" * 60)
