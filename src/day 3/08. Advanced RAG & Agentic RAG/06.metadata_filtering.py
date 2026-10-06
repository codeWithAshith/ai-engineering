# 06 — Metadata filtering (context filtering on the retrieve path)
#
# KEEP: hybrid pool + cross-encoder rerank.
# NEW: filter topic=refund before the expensive rerank (desk already knows the case type).
#
# Why this is required:
#   Hybrid + rerank still search the whole corpus. A return ticket can pull
#   shipping or contacts chunks that share words like ORD-* or "days".
#   That noise hurts precision and wastes the cross-encoder.
#   Metadata filter cuts search to the known lane (here topic=refund) first.
#
# Use when the desk/router already knows the lane (topic, tenant, date, ACL)
# or other docs must stay hidden. Skip when the ticket needs two topics
# (refund timing AND who to email) — over-filtering hides contacts.
# Full failure map: 01.rag_failure_analysis.py

from pathlib import Path
from typing import Callable

from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
RRF_K = 60
POOL_K = 6
TOP_N = 3
QUESTION = "Can I return ORD-88421 and get money back to my card?"
TOPIC = {
    "refund_policy.txt": "refund",
    "shipping_policy.txt": "shipping",
    "contacts.txt": "contacts",
}
RERANKER = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def ingest(folder: Path) -> tuple[InMemoryVectorStore, list[Document], BM25Okapi]:
    docs = [
        Document(
            page_content=path.read_text(encoding="utf-8").strip(),
            metadata={"source": path.name, "topic": TOPIC[path.name]},
        )
        for path in sorted(folder.glob("*.txt"))
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    store = InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))
    bm25 = BM25Okapi([chunk.page_content.lower().split() for chunk in chunks])
    print(f"ingest {len(docs)} docs → {len(chunks)} chunks")
    return store, chunks, bm25


def bm25_rank(bm25: BM25Okapi, chunks: list[Document], question: str, k: int = 5) -> list[Document]:
    scores = bm25.get_scores(question.lower().split())
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return [chunks[i] for i in ranked[:k]]


def reciprocal_rank_fusion(lists: list[list[Document]], k: int = 5) -> list[Document]:
    scores: dict[int, float] = {}
    by_key: dict[int, Document] = {}
    for ranked in lists:
        for rank, doc in enumerate(ranked):
            key = hash(doc.page_content)
            by_key[key] = doc
            scores[key] = scores.get(key, 0.0) + 1.0 / (RRF_K + rank + 1)
    ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    return [by_key[key] for key, _ in ordered[:k]]


def hybrid_search(
    store: InMemoryVectorStore,
    bm25: BM25Okapi,
    chunks: list[Document],
    question: str,
    k: int = POOL_K,
    doc_filter: Callable[[Document], bool] | None = None,
) -> list[Document]:
    semantic = store.similarity_search(question, k=k, filter=doc_filter)
    lexical = bm25_rank(bm25, chunks, question, k=k)
    if doc_filter is not None:
        lexical = [doc for doc in lexical if doc_filter(doc)]
    return reciprocal_rank_fusion([semantic, lexical], k=k)


def rerank(question: str, pool: list[Document], top_n: int = TOP_N) -> list[tuple[Document, float]]:
    if not pool:
        return []
    pairs = [(question, doc.page_content) for doc in pool]
    scores = RERANKER.predict(pairs)
    ranked = sorted(zip(pool, scores), key=lambda item: float(item[1]), reverse=True)
    return [(doc, float(score)) for doc, score in ranked[:top_n]]


def only_refund(doc: Document) -> bool:
    return doc.metadata.get("topic") == "refund"


def preview(doc: Document) -> str:
    topic = doc.metadata.get("topic", "?")
    return f"{doc.metadata['source']} ({topic}): {doc.page_content.replace(chr(10), ' ')[:60]}..."


store, chunks, bm25 = ingest(DATA)

# === KEEP: hybrid without filter (from 05) ===
open_pool = hybrid_search(store, bm25, chunks, QUESTION, k=POOL_K)
# === NEW: metadata filter (topic=refund) before rerank ===
filtered_pool = hybrid_search(store, bm25, chunks, QUESTION, k=POOL_K, doc_filter=only_refund)
# === KEEP: cross-encoder rerank (from 05) ===
ranked = rerank(QUESTION, filtered_pool, top_n=TOP_N)

print("=" * 40)
print("ticket:", QUESTION)
print("=== KEEP: hybrid pool (no filter) ===")
for doc in open_pool:
    print(f"  → {preview(doc)}")
print("=== NEW: metadata filter topic=refund ===")
for doc in filtered_pool:
    print(f"  → {preview(doc)}")
print("=== KEEP: cross-encoder rerank (on filtered pool) ===")
for doc, score in ranked:
    print(f"  → {score:.3f}  {preview(doc)}")
print("=" * 40)
