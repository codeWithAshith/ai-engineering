# 05 — Specialist agents (Acme order-support)
#
# Deep expertise in one domain — richer prompts + own corpus + explicit boundaries.
# A classifier picks the niche; that specialist answers (no merge).
#
#   ticket → classify (LLM domain) →
#     refund_specialist | shipping_specialist | compliance_specialist
#   → END
#
# Same Day 2 Acme corpus. Compliance uses policy + contacts and a legal disclaimer.
#
# Vs generalist: specialists hallucinate less in-domain (narrow, deep prompt).
# Vs 02 workers: workers are task executors; specialists are domain experts.
# Vs 04 router: same one-path shape; 05 prompts are deeper (checklists, boundaries).
# When: compliance, regulated wording, deep tooling per domain.
# Skip when: FAQ / chitchat — cheaper path in 04.
#
# Demo tickets (expected domain):
#   "Can I return ORD-88421 and get money back to my card?" → refund
#   "How long does standard shipping take for ORD-88421?" → shipping
#   "Is it legal for Acme to refuse my ORD-88421 refund after 50 days?" → compliance

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
TOP_K = 4
FALLBACK = "I don't have policy context for that."

Domain = Literal["refund", "shipping", "compliance"]

TICKETS = [
    "Can I return ORD-88421 and get money back to my card?",
    "How long does standard shipping take for ORD-88421?",
    "Is it legal for Acme to refuse my ORD-88421 refund after 50 days?",
]


class DomainDecision(BaseModel):
    """Pick the specialist niche — not a multi-agent merge."""

    domain: Domain = Field(
        description=(
            "refund = return / refund / payment method how-to; "
            "shipping = delivery ETA / tracking / express; "
            "compliance = legal rights, 'is it legal', refuse/deny disputes, "
            "escalation wording — needs policy facts PLUS a not-legal-advice boundary"
        )
    )
    why: str = Field(description="One short sentence for the audit log")


class State(TypedDict):
    question: str
    domain: str
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


refund_store = ingest_corpus([DATA / "refund_policy.txt"], "refund")
shipping_store = ingest_corpus([DATA / "shipping_policy.txt"], "shipping")
contacts_store = ingest_corpus([DATA / "contacts.txt"], "contacts")

# Compliance specialist may fan-in refund + contacts (still one specialist node).
COMPLIANCE_STORES = [refund_store, contacts_store]

SPECIALIST_SYSTEM = {
    "refund": (
        "You are Acme's REFUND POLICY SPECIALIST.\n"
        "Depth checklist — cover what the context supports:\n"
        "  • refund window from delivery\n"
        "  • receipt requirement\n"
        "  • payment method / timeline after approval\n"
        "  • partial returns if relevant\n"
        "Stay inside refund policy. Do not invent portals or fees.\n"
        "If context is missing, reply exactly: " + FALLBACK
    ),
    "shipping": (
        "You are Acme's SHIPPING OPERATIONS SPECIALIST.\n"
        "Depth checklist — cover what the context supports:\n"
        "  • standard vs express ETA\n"
        "  • when tracking appears\n"
        "  • pending vs shipped\n"
        "  • international caveats if relevant\n"
        "Stay inside shipping policy. Do not invent carriers or fees.\n"
        "If context is missing, reply exactly: " + FALLBACK
    ),
    "compliance": (
        "You are Acme's POLICY COMPLIANCE SPECIALIST (not a lawyer).\n"
        "Explain what the written policy says about the customer's situation.\n"
        "ALWAYS include this boundary line verbatim:\n"
        "  \"This is general policy information, not legal advice.\"\n"
        "Point to the support email from context when escalation helps.\n"
        "Do not invent statutes, case law, or guarantees.\n"
        "If context is missing, reply exactly: " + FALLBACK
    ),
}

SEARCH_FOR = {
    "refund": "Acme refund return window payment method receipt ORD-*",
    "shipping": "Acme standard express shipping delivery tracking ORD-*",
    "compliance": "Acme refund window refuse deny policy support email ORD-*",
}

MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
CLASSIFIER = MODEL.with_structured_output(DomainDecision)
print(f"ingest refund + shipping + contacts · specialist desk ready · {len(TICKETS)} tickets")


def retrieve_context(domain: str, question: str) -> tuple[str, list[str]]:
    if domain == "compliance":
        hits: list[Document] = []
        seen: set[str] = set()
        for store in COMPLIANCE_STORES:
            for hit in store.similarity_search(SEARCH_FOR[domain], k=2):
                if hit.page_content not in seen:
                    seen.add(hit.page_content)
                    hits.append(hit)
    else:
        store = refund_store if domain == "refund" else shipping_store
        hits = store.similarity_search(SEARCH_FOR[domain], k=TOP_K)

    if not hits:
        return "", []

    sources = sorted({h.metadata["source"] for h in hits})
    context = "\n\n".join(
        f"[{h.metadata['source']}] {h.page_content}" for h in hits
    )
    return context, sources


def run_specialist(domain: str, question: str) -> tuple[str, list[str]]:
    context, sources = retrieve_context(domain, question)
    if not context:
        return FALLBACK, []

    sources_line = ", ".join(sources)
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                SPECIALIST_SYSTEM[domain]
                + "\nEnd with exactly:\nSources: {sources_line}\n\n"
                "Context:\n{context}"
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    reply = (prompt | MODEL).invoke(
        {
            "context": context,
            "question": question,
            "sources_line": sources_line,
        }
    )
    return reply.content, sources


def classify(state: State) -> dict:
    log = list(state.get("log") or [])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Classify the Acme ticket into ONE specialist domain.\n"
                "- refund: how to return / get money back (operational)\n"
                "- shipping: delivery timing / tracking\n"
                "- compliance: legal rights, 'is it legal', refuse/deny disputes, "
                "threats to sue, policy fairness fights\n"
                "Prefer compliance when the customer challenges legality or refusal."
            ),
            HumanMessagePromptTemplate.from_template("Ticket:\n{question}"),
        ]
    )
    decision: DomainDecision = (prompt | CLASSIFIER).invoke(
        {"question": state["question"]}
    )
    log.append(f"classify → {decision.domain} · {decision.why}")
    return {
        "domain": decision.domain,
        "why": decision.why,
        "citations": [],
        "answer": "",
        "log": log,
    }


def domain_edge(state: State) -> str:
    return state["domain"]


def refund_specialist(state: State) -> dict:
    answer, sources = run_specialist("refund", state["question"])
    log = list(state["log"])
    log.append(f"refund_specialist · sources={sources}")
    return {"answer": answer, "citations": sources, "log": log}


def shipping_specialist(state: State) -> dict:
    answer, sources = run_specialist("shipping", state["question"])
    log = list(state["log"])
    log.append(f"shipping_specialist · sources={sources}")
    return {"answer": answer, "citations": sources, "log": log}


def compliance_specialist(state: State) -> dict:
    answer, sources = run_specialist("compliance", state["question"])
    log = list(state["log"])
    log.append(f"compliance_specialist · sources={sources}")
    return {"answer": answer, "citations": sources, "log": log}


graph = StateGraph(State)
graph.add_node("classify", classify)
graph.add_node("refund", refund_specialist)
graph.add_node("shipping", shipping_specialist)
graph.add_node("compliance", compliance_specialist)

graph.add_edge(START, "classify")
graph.add_conditional_edges(
    "classify",
    domain_edge,
    {
        "refund": "refund",
        "shipping": "shipping",
        "compliance": "compliance",
    },
)
graph.add_edge("refund", END)
graph.add_edge("shipping", END)
graph.add_edge("compliance", END)
app = graph.compile()

print("=" * 60)
print("05 — Specialist agents (Acme)")
print("classify → [refund | shipping | compliance] → END")
print("=" * 60)

for question in TICKETS:
    print(f"\nticket: {question}")
    result = app.invoke(
        {
            "question": question,
            "domain": "",
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
print("Deep domain prompts + boundaries. One specialist answers.")
print("=" * 60)
