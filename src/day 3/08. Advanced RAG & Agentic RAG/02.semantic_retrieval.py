# 02 — Semantic retrieval
#
# Semantic retrieval is one step: find chunks by meaning (embeddings + similarity).
# Output = ranked passages.
#
# RAG is the full loop: retrieve those passages → put them in the prompt →
# generate an answer from them.
#
# Dense search: embedding vectors; every dimension is a learned signal, not a single word.
#
# Retrieval ladder starts here. One Acme ticket grows through 02→14.
# This file: meaning-only search.

from pathlib import Path

from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
QUESTION = "How long do I have to send an item back after it arrives?"


def ingest(folder: Path) -> InMemoryVectorStore:
    docs = [
        Document(page_content=path.read_text(encoding="utf-8").strip(), metadata={"source": path.name})
        for path in sorted(folder.glob("*.txt"))
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    print(f"ingest {len(docs)} docs → {len(chunks)} chunks")
    return InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))


def preview(doc: Document) -> str:
    return f"{doc.metadata['source']}: {doc.page_content.replace(chr(10), ' ')[:70]}..."


# === semantic (this lesson) ===
store = ingest(DATA)
hits = store.similarity_search(QUESTION, k=3)

print("=" * 40)
print("ticket:", QUESTION)
print("=== semantic ===")
for doc in hits:
    print(f"  → {preview(doc)}")
print("=" * 40)
