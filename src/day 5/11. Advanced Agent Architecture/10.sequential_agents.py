# 10 — Sequential agents (Acme order-support)
#
# Fixed pipeline: each stage's output feeds the next. No branching.
#
#   ticket → intake → retrieve → outline → writer → editor → answer
#
# Same Day 2 Acme corpus. Order matters: outline needs context; writer needs
# outline; editor needs draft.
#
# Trade-off: slower than parallel (09); errors propagate unless you insert
# gates (06 critic / 07 evaluator) between stages.
#
# Vs 03 planner/executor: stages here are fixed; planner invents steps at runtime.
# Vs 09 parallel: use sequential when B needs A's output.
# When: content pipelines (intake → outline → draft → edit).
# Skip when: stages are independent — fan out (09) instead.
#
# Demo ticket:
#   "Can I return ORD-88421 and get money back to my card?"

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

load_dotenv()

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
TOP_K = 3
FALLBACK = "I don't have policy context for that. Email help@acme.example."

TICKET = "  Can I return ORD-88421 and get money back to my card?  \n"


class State(TypedDict):
    raw_notes: str
    question: str
    context: str
    citations: list[str]
    outline: str
    draft: str
    polished: str
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
print("ingest flat Acme policies · sequential pipeline ready")


def intake(state: State) -> dict:
    """Normalize the ticket text before anyone retrieves."""
    log = list(state.get("log") or [])
    question = " ".join(state["raw_notes"].split()).strip()
    log.append(f"intake · cleaned → {question!r}")
    return {"question": question, "log": log}


def retrieve(state: State) -> dict:
    """Needs intake's question — cannot run in parallel with intake."""
    log = list(state["log"])
    hits = store.similarity_search(state["question"], k=TOP_K)
    sources = sorted({h.metadata["source"] for h in hits}) if hits else []
    context = (
        "\n\n".join(f"[{h.metadata['source']}] {h.page_content}" for h in hits)
        if hits
        else "(empty)"
    )
    log.append(f"retrieve · sources={sources}")
    return {"context": context, "citations": sources, "log": log}


def outline_agent(state: State) -> dict:
    """Needs retrieve's context — structure before drafting."""
    log = list(state["log"])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme intake outline. Write a 3-bullet outline for a "
                "customer reply using ONLY the policy context. No full sentences "
                "of customer reply yet — bullets only."
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nPolicy context:\n{context}"
            ),
        ]
    )
    outline = (prompt | MODEL).invoke(
        {"question": state["question"], "context": state["context"]}
    ).content
    log.append("outline · bullets ready")
    return {"outline": outline, "log": log}


def writer_agent(state: State) -> dict:
    """Needs outline + context — first full draft."""
    log = list(state["log"])
    allowed = ", ".join(state.get("citations") or []) or "(none)"
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme support writer. Turn the outline into a draft reply.\n"
                "Facts only from policy context. Do NOT invent portals, account "
                "UI steps, URLs, fees, or phones absent from context.\n"
                "End with Sources: using filenames from: "
                f"{allowed}. If context empty: {FALLBACK}"
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nOutline:\n{outline}\n\n"
                "Policy context:\n{context}"
            ),
        ]
    )
    draft = (prompt | MODEL).invoke(
        {
            "question": state["question"],
            "outline": state["outline"],
            "context": state["context"],
        }
    ).content
    log.append("writer · draft ready")
    return {"draft": draft, "log": log}


def editor_agent(state: State) -> dict:
    """Needs writer draft — polish tone; do not invent new policy facts."""
    log = list(state["log"])
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "You are Acme support editor. Polish the draft for clarity and "
                "tone. Keep every policy fact and the Sources line. Do NOT add "
                "portals, URLs, fees, or phones that are not already in the draft."
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket:\n{question}\n\nDraft:\n{draft}"
            ),
        ]
    )
    polished = (prompt | MODEL).invoke(
        {"question": state["question"], "draft": state["draft"]}
    ).content
    log.append("editor · polished ready")
    return {"polished": polished, "log": log}


graph = StateGraph(State)
graph.add_node("intake", intake)
graph.add_node("retrieve", retrieve)
graph.add_node("outline", outline_agent)
graph.add_node("writer", writer_agent)
graph.add_node("editor", editor_agent)

graph.add_edge(START, "intake")
graph.add_edge("intake", "retrieve")
graph.add_edge("retrieve", "outline")
graph.add_edge("outline", "writer")
graph.add_edge("writer", "editor")
graph.add_edge("editor", END)
app = graph.compile()

print("=" * 60)
print("10 — Sequential agents (Acme)")
print("intake → retrieve → outline → writer → editor")
print("=" * 60)
print(f"\nraw_notes: {TICKET!r}")

result = app.invoke(
    {
        "raw_notes": TICKET,
        "question": "",
        "context": "",
        "citations": [],
        "outline": "",
        "draft": "",
        "polished": "",
        "log": [],
    }
)

for line in result["log"]:
    print(f"  · {line}")

print(f"\noutline:\n{result['outline']}")
print(f"\ndraft:\n{result['draft']}")
print(f"\npolished:\n{result['polished']}")
print("\n" + "=" * 60)
print("Each stage needs the previous field — cannot fan out like 09.")
print("Insert 06/07 between writer and editor when quality gates matter.")
print("=" * 60)
