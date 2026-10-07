# 10 — Contextual compression + grounded answer
#
# KEEP: filter → hybrid → cross-encoder rerank.
# NEW: (1) compress with extractor and summarizer, then (2) grounded answer.
#
# Why / when compression is required:
#   Reranked chunks can still be long. Extra sentences add cost, risk truncation,
#   and distract the model (CONTEXT_BLOAT / weaker faithfulness).
#
# Production compressors (both shown below):
#   Extractor  — keep only original sentences that answer the question (no rewrite).
#                Prefer for support/policy: wording stays faithful.
#   Summarizer — rewrite a shorter version for the question.
#                Prefer for long narrative docs; risk dropping exact numbers.
#
# Why / when grounded answer is required:
#   Compression shrinks context. Generation still needs a hard rule: answer ONLY
#   from that context (no world knowledge, no invented fees/portals/timelines).
#   Without grounding, the model can still hallucinate even on short text.
#   Metric: FAITHFULNESS (and often answer relevancy) in 01.rag_failure_analysis.py.
#
# Grounded answer (this file):
#   System prompt: "Answer ONLY from the policy context below."
#   If context does not say → exact fallback: "I don't have policy context for that."
#   Desk default here: ground on EXTRACTOR output (faithful wording), not summarizer.
#
# Vs Day 2 grounded answers:
#   Day 2 grounded on raw retrieved chunks. Here we ground on compressed context
#   after filter → hybrid → rerank → extract — same rule, cleaner prompt.
#
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
QUESTION = "Can I return ORD-88421 and get money back to my card?"
TOPIC = {
    "refund_policy.txt": "refund",
    "shipping_policy.txt": "shipping",
    "contacts.txt": "contacts",
}
RERANKER = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)

EXTRACT = (
    ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Extract ONLY the sentences from the passage that help answer the question. "
                "Copy wording from the passage. Do not paraphrase. "
                "If nothing helps, return exactly: NONE"
            ),
            HumanMessagePromptTemplate.from_template(
                "Question: {question}\n\nPassage:\n{passage}"
            ),
        ]
    )
    | MODEL
    | StrOutputParser()
)

SUMMARIZE = (
    ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Summarize the passage in 1-2 short sentences for answering the question. "
                "Keep order ids, day counts, and payment facts exact."
            ),
            HumanMessagePromptTemplate.from_template(
                "Question: {question}\n\nPassage:\n{passage}"
            ),
        ]
    )
    | MODEL
    | StrOutputParser()
)

GROUNDED = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "Acme order support. Answer ONLY from the policy context below. "
            "If the context does not say, reply exactly: I don't have policy context for that. "
            "Do not invent fees, portals, or timelines.\n\nContext:\n{context}"
        ),
        HumanMessagePromptTemplate.from_template("{question}"),
    ]
)


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


def extract(doc: Document, question: str) -> Document:
    text = EXTRACT.invoke({"question": question, "passage": doc.page_content}).strip()
    return Document(page_content=text, metadata={**doc.metadata, "compress": "extract"})


def summarize(doc: Document, question: str) -> Document:
    text = SUMMARIZE.invoke({"question": question, "passage": doc.page_content}).strip()
    return Document(page_content=text, metadata={**doc.metadata, "compress": "summarize"})


def only_refund(doc: Document) -> bool:
    return doc.metadata.get("topic") == "refund"


store, chunks, bm25 = ingest(DATA)

# === KEEP: filter → hybrid → rerank ===
pool = hybrid_search(store, bm25, chunks, QUESTION, k=POOL_K, doc_filter=only_refund)
ranked = rerank(QUESTION, pool, top_n=TOP_N)
final_docs = [doc for doc, _ in ranked]

# === NEW: extractor + summarizer on the same chunks ===
extracted = [extract(doc, QUESTION) for doc in final_docs]
summarized = [summarize(doc, QUESTION) for doc in final_docs]

# === NEW: grounded answer (ONLY from compressed context) ===
# Desk default for policy: ground on extracted text (faithful wording).
extract_for_answer = [doc for doc in extracted if doc.page_content.upper() != "NONE"]
context = "\n\n".join(f"[{doc.metadata['source']}] {doc.page_content}" for doc in extract_for_answer)
reply = (GROUNDED | MODEL).invoke({"context": context, "question": QUESTION})

print("=" * 60)
print("ticket:", QUESTION)
print()

print("1) AFTER RERANK (full chunks going into compression)")
print("-" * 60)
for index, (doc, score) in enumerate(ranked, start=1):
    print(f"  chunk {index}  score={score:.3f}  source={doc.metadata['source']}")
    print(f"  {doc.page_content}")
    print()

print("2) EXTRACTOR returns (copy useful sentences only — no rewrite)")
print("-" * 60)
for index, doc in enumerate(extracted, start=1):
    print(f"  chunk {index}  source={doc.metadata['source']}")
    print(f"  RETURNS → {doc.page_content}")
    print()

print("3) SUMMARIZER returns (rewrite shorter — may rephrase)")
print("-" * 60)
for index, doc in enumerate(summarized, start=1):
    print(f"  chunk {index}  source={doc.metadata['source']}")
    print(f"  RETURNS → {doc.page_content}")
    print()

print("4) GROUNDED ANSWER (uses extractor output as context)")
print("-" * 60)
print(reply.content)
print()
print("=" * 60)
