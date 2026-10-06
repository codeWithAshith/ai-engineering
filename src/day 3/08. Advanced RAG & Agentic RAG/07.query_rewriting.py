# 07 — Query rewriting (query reformulation)
#
# KEEP: filter → hybrid → cross-encoder rerank.
# NEW: rewrite messy chat into a clean search query first.
#
# Why / when this is required:
#   The user's words often will not match the index well.
#   - Typos, slang, abbreviations ("snd back", "money 2 my card")
#   - Paraphrase that misses policy terms ("send it back" vs "refund")
#   - Eval: low context precision/recall because the raw chat is a bad search string
#   Rewrite once into a clean query, then run filter → hybrid → rerank.
#
# Not required when the query is already clear, or the issue is two separate
# asks (09 decompose) or "one wording is not enough" (08 multi-query).
# Full failure map: 01.rag_failure_analysis.py

from pathlib import Path
from typing import Callable

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

load_dotenv()

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
RRF_K = 60
POOL_K = 6
TOP_N = 3
QUESTION = "uuh can i snd back ORD-88421?? money 2 my card pls"
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
    return f"{doc.metadata['source']}: {doc.page_content.replace(chr(10), ' ')[:70]}..."


store, chunks, bm25 = ingest(DATA)

# === NEW: query rewrite ===
rewriter = (
    ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Rewrite the support chat into one short search query for Acme order policies. "
                "Keep order ids. Return ONLY the query."
            ),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    | init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
    | StrOutputParser()
)
rewritten = rewriter.invoke({"question": QUESTION})

# === KEEP: filter → hybrid → rerank (from 06/05/04) ===
pool = hybrid_search(store, bm25, chunks, rewritten, k=POOL_K, doc_filter=only_refund)
ranked = rerank(rewritten, pool, top_n=TOP_N)

print("=" * 40)
print("ticket (messy):", QUESTION)
print("=== NEW: query rewrite ===")
print(f"  original:  {QUESTION}")
print(f"  rewritten: {rewritten}")
print("=== KEEP: filter → hybrid pool ===")
for doc in pool:
    print(f"  → {preview(doc)}")
print("=== KEEP: cross-encoder rerank ===")
for doc, score in ranked:
    print(f"  → {score:.3f}  {preview(doc)}")
print("=" * 40)
