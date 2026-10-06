# 03 — BM25 (added on top of 02)
#
# KEEP: semantic from 02 = dense search (embedding vectors; every dimension is a
# learned signal, not a single word).
# NEW: BM25 = sparse search — mostly zeros; only the query/document terms that
# appear get non-zero weights. Strong on exact tokens, weak on paraphrase.

from pathlib import Path

from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
QUESTION = "How long do I have to send an item back after it arrives?"
EXACT = "VIP desk phone +1-555-0100"


def ingest(folder: Path) -> tuple[InMemoryVectorStore, list[Document], BM25Okapi]:
    docs = [
        Document(page_content=path.read_text(encoding="utf-8").strip(), metadata={"source": path.name})
        for path in sorted(folder.glob("*.txt"))
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    store = InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))
    bm25 = BM25Okapi([chunk.page_content.lower().split() for chunk in chunks])
    print(f"ingest {len(docs)} docs → {len(chunks)} chunks")
    return store, chunks, bm25


def bm25_rank(bm25: BM25Okapi, chunks: list[Document], question: str, k: int = 3) -> list[Document]:
    scores = bm25.get_scores(question.lower().split())
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return [chunks[i] for i in ranked[:k]]


def preview(doc: Document) -> str:
    return f"{doc.metadata['source']}: {doc.page_content.replace(chr(10), ' ')[:70]}..."


store, chunks, bm25 = ingest(DATA)

print("=" * 40)
print("ticket:", QUESTION)

# === KEEP: semantic ===
print("=== KEEP: semantic ===")
for doc in store.similarity_search(QUESTION, k=3):
    print(f"  → {preview(doc)}")

# === bm25 ===
print("=== bm25 ===")
print("  paraphrase:")
for doc in bm25_rank(bm25, chunks, QUESTION):
    print(f"  → {preview(doc)}")
print("  exact token (BM25 strength):")
for doc in bm25_rank(bm25, chunks, EXACT):
    print(f"  → {preview(doc)}")
print("=" * 40)
