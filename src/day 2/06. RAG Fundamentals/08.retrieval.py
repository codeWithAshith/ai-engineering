# 08 — Retriever
#
# Why a retriever? (you already have store.similarity_search in lesson 07)
#
#   store.similarity_search(q, k=2)  — tied to THIS vector store API
#   retriever.invoke(q)              — same job, but a stable interface:
#                                      "question in → list[Document] out"
#
# You need it when the rest of the app should NOT care how search works:
#   - LCEL / LangGraph: pipe retriever into a prompt (next lessons)
#   - swap InMemory → Chroma/FAISS later without rewriting every call site
#   - k / filters live in one place (search_kwargs), not copied everywhere
#
# Under the hood it still embeds the query and runs similarity search — same as 07.
# Retriever = thin wrapper so "get relevant docs" is one reusable step.
#
# Limitation overcome: calling similarity_search everywhere couples the app to one store.
# Example: as_retriever on Acme policy index.
# Still limited: retrieved docs are not yet an LLM answer.

from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

DATA = Path(__file__).parent / "data"
embeddings = OllamaEmbeddings(model="nomic-embed-text")

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
chunks = RecursiveCharacterTextSplitter(chunk_size=160, chunk_overlap=40).split_documents(
    docs
)
# Same search as lesson 07, but via retriever.invoke (not store.similarity_search)
retriever = InMemoryVectorStore.from_documents(
    chunks, embedding=embeddings
).as_retriever(search_kwargs={"k": 2})  # k baked in once

for d in retriever.invoke("How long is standard shipping for ORD orders?"):
    print(f"[{d.metadata['source']}] {d.page_content[:90]}...")
print("-" * 100)
