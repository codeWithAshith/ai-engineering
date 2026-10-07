# 15 — HyDE (Hypothetical Document Embeddings)
#
# Query-reformulation family (next to 07 rewrite / 08 multi-query).
#
# KEEP: semantic retrieve with the raw ticket (from 02).
# NEW: ask the model for a short *hypothetical policy passage* that would
#      answer the ticket, embed THAT passage, and search with it.
#
# Why / when this is required:
#   The user's wording can sit far from how policies are written
#   ("send it back" / "get my money" vs "refund within 45 days of delivery").
#   Embedding a fake answer pulls the query vector into document space —
#   often better recall than embedding the chat alone.
#
# Vs 07 rewrite: rewrite → still a *question* string.
#               HyDE → a *document-like* string, then embed.
# Vs 08 multi-query: many question phrasings; HyDE is one hypothetical doc.
#
# Not required when exact tokens matter most (phone / ORD-* → BM25/hybrid),
# the ask is two desks (09), or the query already matches policy language.
# Full failure map: 01.rag_failure_analysis.py

from pathlib import Path

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

load_dotenv()

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
# Vocabulary gap: chatty ask vs policy wording ("refund", "45 days", "delivery").
QUESTION = "How long do I have to send an item back after it arrives?"
K = 3


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


def hypothetical_passage(question: str) -> str:
    """LLM writes a fake policy snippet — not shown to the user; used only to embed/search."""
    chain = (
        ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(
                    "You write short Acme order-support policy passages for retrieval demos. "
                    "Given a customer question, write 2-4 sentences that LOOK like they came "
                    "from an internal refund/shipping/contacts policy file. "
                    "Use policy wording (refund, delivery, business days, ORD-*). "
                    "Do NOT answer the user. Do NOT say you are hypothetical. "
                    "Return ONLY the passage."
                ),
                HumanMessagePromptTemplate.from_template("{question}"),
            ]
        )
        | init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0.3)
        | StrOutputParser()
    )
    return chain.invoke({"question": question}).strip()


store = ingest(DATA)

# === KEEP: semantic on the raw ticket (from 02) ===
raw_hits = store.similarity_search(QUESTION, k=K)

# === NEW: HyDE — embed a hypothetical policy passage, then search ===
hyde_doc = hypothetical_passage(QUESTION)
hyde_hits = store.similarity_search(hyde_doc, k=K)

print("=" * 50)
print("ticket:", QUESTION)
print()
print("=== KEEP: semantic (embed the question) ===")
for doc in raw_hits:
    print(f"  → {preview(doc)}")
print()
print("=== NEW: HyDE hypothetical passage (embedded instead of the question) ===")
print(hyde_doc)
print()
print("=== NEW: semantic (embed the HyDE passage) ===")
for doc in hyde_hits:
    print(f"  → {preview(doc)}")
print("=" * 50)
print("HyDE search string is document-shaped; rewrite (07) stays question-shaped.")
print("=" * 50)
