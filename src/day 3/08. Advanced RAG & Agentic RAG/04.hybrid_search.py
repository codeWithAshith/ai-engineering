# 04 — Hybrid search (added on top of 02+03)
#
# KEEP: semantic + BM25.
# NEW: RRF merge — one shortlist from both retrievers.
# Ticket grows: order id + return intent.
#
# Reciprocal Rank Fusion (RRF):
#   score(d) = Σ  1 / (k + rank_i(d) + 1)
# over every ranked list i that contains document d.
#
# In this file, enumerate() gives rank 0 for the top hit, 1 for second, ...
# so the code is:  1.0 / (RRF_K + rank + 1)
# The +1 turns 0-based rank into a 1-based place in the denominator
# (same idea as the classic formula 1/(k + rank) when rank starts at 1).
#
# Why k=60: softens the gap between #1 and #2. Without k, 1/(rank+1) makes
# #1 twice #2 (1.0 vs 0.5). With k=60, #1 is 1/61 and #2 is 1/62 — almost equal —
# so "high on both lists" beats "won only one list by a lot."
#
# Example with k=60:
#   refund   semantic rank=0 → 60+0+1=61, bm25 rank=1 → 60+1+1=62
#            score = 1/61 + 1/62 ≈ 0.0325
#   shipping semantic rank=2 → 63, bm25 rank=0 → 61
#            score = 1/63 + 1/61 ≈ 0.0323
#   contacts semantic rank=1 → 62, missing from bm25
#            score = 1/62 ≈ 0.0161
#   → refund wins (strong on both lists)

from pathlib import Path

from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
RRF_K = 60  # k in 1 / (k + rank + 1)
QUESTION = "Can I return ORD-88421 and get money back to my card?"


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


def bm25_rank(
    bm25: BM25Okapi, chunks: list[Document], question: str, k: int = 5
) -> list[tuple[Document, float]]:
    scores = bm25.get_scores(question.lower().split())
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return [(chunks[i], float(scores[i])) for i in ranked[:k]]


def reciprocal_rank_fusion(lists: list[list[Document]], k: int = 5) -> list[tuple[Document, float]]:
    # score(d) = Σ 1 / (RRF_K + rank + 1) across semantic list + BM25 list
    # rank comes from enumerate(): 0 = top hit → denominator RRF_K+1 (=61 when k=60)
    # Here we fuse by source file and keep the best-ranked chunk for that source.
    scores: dict[str, float] = {}
    best: dict[str, tuple[int, Document]] = {}
    for ranked in lists:
        for rank, doc in enumerate(ranked):
            source = doc.metadata["source"]
            scores[source] = scores.get(source, 0.0) + 1.0 / (RRF_K + rank + 1)
            if source not in best or rank < best[source][0]:
                best[source] = (rank, doc)
    ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    return [(best[source][1], score) for source, score in ordered[:k]]


def preview(doc: Document) -> str:
    return f"{doc.metadata['source']}: {doc.page_content.replace(chr(10), ' ')[:70]}..."


store, chunks, bm25 = ingest(DATA)

# === KEEP: semantic (from 02) ===
semantic = store.similarity_search_with_score(QUESTION, k=5)
# === KEEP: bm25 (from 03) ===
lexical = bm25_rank(bm25, chunks, QUESTION, k=5)
# === NEW: hybrid / RRF ===
hybrid = reciprocal_rank_fusion(
    [[doc for doc, _ in semantic], [doc for doc, _ in lexical]],
    k=5,
)

print("=" * 40)
print("ticket:", QUESTION)
print("=== KEEP: semantic (from 02) — cosine similarity ===")
for doc, score in semantic:
    print(f"  → {score:.4f}  {preview(doc)}")
print("=== KEEP: bm25 (from 03) — BM25 score ===")
for doc, score in lexical:
    print(f"  → {score:.4f}  {preview(doc)}")
print("=== NEW: hybrid / RRF — 1/(k+rank+1) sum ===")
for doc, score in hybrid[:3]:
    print(f"  → {score:.4f}  {preview(doc)}")
print("=" * 40)
