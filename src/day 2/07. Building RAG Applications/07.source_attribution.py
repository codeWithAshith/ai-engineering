# 07 — Source attribution
#
# Concept: pair the answer with source file names from retrieved chunks.
#
# Limitation overcome: support agents must show which policy backed the reply.
# Example: shipping question → answer stub + sources list.
# Still limited: chain / graph wiring still ad hoc — next lessons package it.

from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

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
).as_retriever(search_kwargs={"k": 2})

question = "How long is express shipping?"
hits = retriever.invoke(question)
sources = sorted({d.metadata["source"] for d in hits})
print("question:", question)
print("sources:", sources)
print("snippets:")
for d in hits:
    print(f"  - {d.page_content[:70]}...")
print("-" * 100)
