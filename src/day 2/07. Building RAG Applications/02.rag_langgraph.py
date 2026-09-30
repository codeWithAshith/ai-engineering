# 02 — RAG LangGraph
#
# answer is written here, so the reply is on this page.
# retrieve finds the passages. generate calls answer and sends the reply back.

from pathlib import Path
from typing import TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import END, START, StateGraph

load_dotenv()

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"
FALLBACK = "I don't have policy context for that. Email help@acme.example."
POLICY_HINTS = ("refund", "ship", "email", "vip", "express", "ord", "delivery", "contact")
PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", "Acme order support. Answer from this policy text only:\n{context}"),
        ("human", "{question}"),
    ]
)
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b")


def ingest(folder: Path) -> InMemoryVectorStore:
    docs = [
        Document(
            page_content=path.read_text(encoding="utf-8").strip(),
            metadata={"source": path.name},
        )
        for path in sorted(folder.glob("*.txt"))
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    return InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))


def query(store: InMemoryVectorStore, question: str) -> str:
    if not any(hint in question.lower() for hint in POLICY_HINTS):
        return FALLBACK
    hits = store.similarity_search(question, k=3)
    if not hits:
        return FALLBACK
    sources = sorted({hit.metadata["source"] for hit in hits})
    context = "\n\n".join(f"[{hit.metadata['source']}] {hit.page_content}" for hit in hits)
    return f"sources: {sources}\n{context}"


def answer(store: InMemoryVectorStore, question: str) -> str:
    found = query(store, question)
    if found == FALLBACK:
        return FALLBACK
    sources, context = found.split("\n", 1)
    reply = (PROMPT | MODEL).invoke({"context": context, "question": question})
    return f"{reply.content}\n{sources}"


store = ingest(DATA)


class RAGState(TypedDict):
    question: str
    context: str
    answer: str


def retrieve(state: RAGState) -> dict:
    return {"context": query(store, state["question"])}


def generate(state: RAGState) -> dict:
    return {"answer": answer(store, state["question"])}


g = StateGraph(RAGState)
g.add_node("retrieve", retrieve)
g.add_node("generate", generate)
g.add_edge(START, "retrieve")
g.add_edge("retrieve", "generate")
g.add_edge("generate", END)
app = g.compile()

print("example 1")
print("question: What is the refund window?")
print(app.invoke({"question": "What is the refund window?", "context": "", "answer": ""})["answer"])
print("-" * 40)

print("example 2")
print("question: quantum widget warranty on Mars")
print(app.invoke({"question": "quantum widget warranty on Mars", "context": "", "answer": ""})["answer"])
print("-" * 40)
