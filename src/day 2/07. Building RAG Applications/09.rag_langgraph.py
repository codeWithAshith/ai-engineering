# 09 — RAG with LangGraph
#
# Concept: explicit retrieve → generate nodes (room for retries / HITL later).
#
# Limitation overcome: LCEL is a straight chain; graphs make steps inspectable.
# Same Acme policy corpus. Day 1 already taught nodes/edges — here applied to RAG.
# Still limited: model always retrieves; an agent should choose when to search.

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
embeddings = OllamaEmbeddings(model="nomic-embed-text")
docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
retriever = InMemoryVectorStore.from_documents(
    RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs),
    embedding=embeddings,
).as_retriever(search_kwargs={"k": 3})

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "Acme order support. Use ONLY:\n{context}"),
        ("human", "{question}"),
    ]
)
model = init_chat_model(model="groq:openai/gpt-oss-20b")


class RAGState(TypedDict):
    question: str
    context: str
    answer: str


def retrieve(state: RAGState) -> dict:
    hits = retriever.invoke(state["question"])
    return {"context": "\n\n".join(d.page_content for d in hits)}


def generate(state: RAGState) -> dict:
    msg = (prompt | model).invoke(
        {"context": state["context"], "question": state["question"]}
    )
    return {"answer": msg.content}


g = StateGraph(RAGState)
g.add_node("retrieve", retrieve)
g.add_node("generate", generate)
g.add_edge(START, "retrieve")
g.add_edge("retrieve", "generate")
g.add_edge("generate", END)
app = g.compile()

print(app.get_graph().draw_mermaid())
print("-" * 100)
print(app.invoke({"question": "Who do I email for ORD tickets?", "context": "", "answer": ""}))
print("-" * 100)
