# 07 — Evaluator agents (Acme order-support)
#
# Score answers against a rubric. Metrics for monitoring / CI / sampling —
# not a rewrite loop (that is 06 critic).
#
#   case → retrieve_context → evaluate (LLM rubric) → report
#
# Same Day 2 Acme corpus. Pair with Day 3 metrics mindset: grade the *answer*.
#
# Vs 06 critic: critic writes feedback and revises; evaluator only scores.
# When: offline suites, production sampling, A/B tests, alerts on pass-rate drop.
# Skip when: you need the model to fix the draft (use 06).
#
# Eval suite mixes good grounded replies with planted failures.

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

# Offline-style suite: question + candidate answer (+ expected outcome for the log).
CASES = [
    {
        "label": "good_refund",
        "question": "Can I return ORD-88421 and get money back to my card?",
        "answer": (
            "Yes. Request a refund within 45 days of delivery with the receipt. "
            "Approved refunds go to the original payment method within 5–7 business days. "
            "Sources: refund_policy.txt"
        ),
        "expect_pass": True,
    },
    {
        "label": "invents_portal",
        "question": "Can I return ORD-88421 and get money back to my card?",
        "answer": (
            "Sure — open https://portal.acme.example/refunds and click Instant Cashback. "
            "Sources: refund_policy.txt"
        ),
        "expect_pass": False,
    },
    {
        "label": "vague",
        "question": "How long does standard shipping take for ORD-88421?",
        "answer": "Maybe it arrives soon if we care about customers. Sources: shipping_policy.txt",
        "expect_pass": False,
    },
    {
        "label": "good_contacts",
        "question": "Who do I email about ORD-88421?",
        "answer": "Email help@acme.example for ORD-* ticket questions. Sources: contacts.txt",
        "expect_pass": True,
    },
]


class RubricScores(BaseModel):
    """Production evaluator output — numbers for dashboards, not edits."""

    grounded: int = Field(ge=0, le=1, description="1 if claims match policy context")
    no_invention: int = Field(
        ge=0,
        le=1,
        description="1 if no portals/URLs/fees/phones absent from context",
    )
    has_sources: int = Field(
        ge=0,
        le=1,
        description="1 if answer ends with a Sources line using real filenames",
    )
    helpful: int = Field(ge=0, le=1, description="1 if it addresses the ticket")
    reason: str = Field(description="One short sentence for the eval log")


class State(TypedDict):
    label: str
    question: str
    answer: str
    expect_pass: bool
    context: str
    citations: list[str]
    scores: dict[str, int]
    passed: bool
    reason: str
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
EVALUATOR = MODEL.with_structured_output(RubricScores)
print(f"ingest flat Acme policies · evaluator ready · {len(CASES)} cases")


def retrieve_context(state: State) -> dict:
    log = list(state.get("log") or [])
    hits = store.similarity_search(state["question"], k=TOP_K)
    sources = sorted({h.metadata["source"] for h in hits}) if hits else []
    context = (
        "\n\n".join(f"[{h.metadata['source']}] {h.page_content}" for h in hits)
        if hits
        else "(empty)"
    )
    log.append(f"retrieve_context · sources={sources}")
    return {"context": context, "citations": sources, "log": log}


def evaluate(state: State) -> dict:
    """Score only — never rewrite the answer."""
    log = list(state["log"])
    allowed = ", ".join(state.get("citations") or []) or "(none from retrieve)"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are an Acme offline evaluator. Score 0 or 1 on each axis.\n"
                "- grounded: every concrete claim appears in the policy context\n"
                "- no_invention: no portals, URLs, fees, or phones missing from context\n"
                "- has_sources: ends with Sources: using real policy filenames "
                f"(retrieved files were: {allowed})\n"
                "- helpful: addresses the customer ticket\n"
                "Do NOT suggest a rewrite. Only score."
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\n"
                "Policy context:\n{context}\n\n"
                "Candidate answer:\n{answer}"
            ),
        ]
    )
    result: RubricScores = (prompt | EVALUATOR).invoke(
        {
            "question": state["question"],
            "context": state["context"],
            "answer": state["answer"],
        }
    )
    scores = {
        "grounded": result.grounded,
        "no_invention": result.no_invention,
        "has_sources": result.has_sources,
        "helpful": result.helpful,
    }
    passed = all(v == 1 for v in scores.values())
    log.append(f"evaluate · scores={scores} · passed={passed} · {result.reason}")
    return {
        "scores": scores,
        "passed": passed,
        "reason": result.reason,
        "log": log,
    }


def report(state: State) -> dict:
    log = list(state["log"])
    match = state["passed"] == state["expect_pass"]
    log.append(
        f"report · label={state['label']} · "
        f"expect_pass={state['expect_pass']} · actual={state['passed']} · "
        f"suite_match={match}"
    )
    return {"log": log}


graph = StateGraph(State)
graph.add_node("retrieve_context", retrieve_context)
graph.add_node("evaluate", evaluate)
graph.add_node("report", report)

graph.add_edge(START, "retrieve_context")
graph.add_edge("retrieve_context", "evaluate")
graph.add_edge("evaluate", "report")
graph.add_edge("report", END)
app = graph.compile()

print("=" * 60)
print("07 — Evaluator agents (Acme)")
print("retrieve_context → evaluate → report  (no revise)")
print("=" * 60)

passed_n = 0
match_n = 0
for case in CASES:
    print(f"\ncase: {case['label']}")
    print(f"ticket: {case['question']}")
    print(f"answer: {case['answer']}")
    result = app.invoke(
        {
            "label": case["label"],
            "question": case["question"],
            "answer": case["answer"],
            "expect_pass": case["expect_pass"],
            "context": "",
            "citations": [],
            "scores": {},
            "passed": False,
            "reason": "",
            "log": [],
        }
    )
    for line in result["log"]:
        print(f"  · {line}")
    if result["passed"]:
        passed_n += 1
    if result["passed"] == case["expect_pass"]:
        match_n += 1

print("\n" + "=" * 60)
print(f"suite: {match_n}/{len(CASES)} expect-match · raw pass {passed_n}/{len(CASES)}")
print("Log scores + traces; alert when pass rate drops.")
print("=" * 60)
