# 06 — No-result handling
#
# Concept: if retrieval is not useful, do not invent policy facts.
#
# Limitation overcome: prompt composition still calls the model on empty context.
# Example: known Acme policy questions vs off-topic → fallback.
# Still limited: good hits should also expose sources in the UI.

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
store = InMemoryVectorStore.from_documents(
    RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs),
    embedding=embeddings,
)

FALLBACK = "I don't have policy context for that. Email help@acme.example."
POLICY_HINTS = ("refund", "ship", "email", "vip", "express", "ord", "delivery", "contact")


def retrieve_or_empty(question: str) -> list[Document]:
    if not any(h in question.lower() for h in POLICY_HINTS):
        return []
    return store.similarity_search(question, k=2)


def answer_or_fallback(question: str) -> str:
    hits = retrieve_or_empty(question)
    if not hits:
        return FALLBACK
    return "CONTEXT:\n" + "\n---\n".join(d.page_content for d in hits)


print("known:", answer_or_fallback("What is the refund window?")[:90], "...")
print("unknown:", answer_or_fallback("quantum widget warranty on Mars"))
print("-" * 100)
