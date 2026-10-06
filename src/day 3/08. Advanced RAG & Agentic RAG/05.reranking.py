# 05 — Reranking (added on top of hybrid)
#
# KEEP: semantic + BM25 + RRF hybrid pool.
# NEW: cross-encoder re-scores that hybrid shortlist (not the whole corpus).
#
# Bi-encoder vs cross-encoder (simple):
#
#   Bi-encoder = two separate encodings, then compare.
#     1) Turn the question into a vector.
#     2) Each policy chunk already has its own vector (saved at ingest).
#     3) Pick chunks whose vectors are closest (cosine).
#     Like labeling two boxes separately, then seeing if the labels match.
#     Fast → use this to search the whole store (01 / hybrid recall).
#
#   Cross-encoder = one joint look at question + chunk together.
#     Send both texts into the model at once: "how relevant is this chunk
#     to this question?" → one score.
#     Like reading the question and the paragraph side by side.
#     More accurate, but slow → do NOT run on every chunk in the index.
#
# Why only after retrieval?
#   Corpus might have thousands of chunks. Cross-encoder on all of them
#   = one slow model call per chunk. Too costly.
#   Instead: bi-encoder/BM25/hybrid grab ~6 candidates quickly, then
#   cross-encoder carefully ranks those 6 and keeps the top 3.
#
# Why rerank if RRF is already there?
#   RRF  = cheap merge of ranked lists when scores aren't comparable
#          (cosine vs BM25). It only looks at order. Fast, no model.
#   Rerank = expensive (query, chunk) scoring. Reads meaning more carefully
#            and puts the best few first for the LLM.
#
# Production stack:
#   1) semantic + BM25 → RRF (good recall, one shortlist)
#   2) cross-encoder rerank that shortlist (better precision)
#
# RRF does not replace a reranker; a reranker does not replace RRF
# (too slow/costly to score the whole corpus).
# When to reach for rerank vs skip: see 01.rag_failure_analysis.py

from pathlib import Path

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
RERANKER = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


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


def bm25_rank(bm25: BM25Okapi, chunks: list[Document], question: str, k: int = 5) -> list[Document]:
    scores = bm25.get_scores(question.lower().split())
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return [chunks[i] for i in ranked[:k]]


def reciprocal_rank_fusion(lists: list[list[Document]], k: int = 5) -> list[Document]:
    # Chunk-level fusion so several refund lines can enter the rerank pool.
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
) -> list[Document]:
    semantic = store.similarity_search(question, k=k)
    lexical = bm25_rank(bm25, chunks, question, k=k)
    return reciprocal_rank_fusion([semantic, lexical], k=k)


def rerank(question: str, pool: list[Document], top_n: int = TOP_N) -> list[tuple[Document, float]]:
    pairs = [(question, doc.page_content) for doc in pool]
    scores = RERANKER.predict(pairs)
    ranked = sorted(zip(pool, scores), key=lambda item: float(item[1]), reverse=True)
    return [(doc, float(score)) for doc, score in ranked[:top_n]]


def preview(doc: Document) -> str:
    return f"{doc.metadata['source']}: {doc.page_content.replace(chr(10), ' ')[:70]}..."


store, chunks, bm25 = ingest(DATA)

# === KEEP: hybrid (from 04) ===
pool = hybrid_search(store, bm25, chunks, QUESTION, k=POOL_K)
# === NEW: cross-encoder rerank ===
ranked = rerank(QUESTION, pool, top_n=TOP_N)

print("=" * 40)
print("ticket:", QUESTION)
print("=== KEEP: hybrid pool (from 04) ===")
for doc in pool:
    print(f"  → {preview(doc)}")
print("=== NEW: cross-encoder rerank ===")
for doc, score in ranked:
    print(f"  → {score:.3f}  {preview(doc)}")
print("=" * 40)
