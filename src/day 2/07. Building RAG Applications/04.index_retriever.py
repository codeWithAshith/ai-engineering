# 04 — Index + retriever
#
# Concept: index chunks once, then retriever.invoke(query) with k set in search_kwargs.
#
# Limitation overcome: repeating similarity_search(..., k=...) everywhere is noisy.
# Example: as_retriever on Acme policy docs (no custom class).
# Still limited: hits are not yet composed into a chat prompt.

from pathlib import Path

from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"
embeddings = OllamaEmbeddings(model="nomic-embed-text")

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(
    docs
)

# k lives here once — not on every search call
retriever = InMemoryVectorStore.from_documents(
    chunks, embedding=embeddings
).as_retriever(search_kwargs={"k": 2})

for d in retriever.invoke("refund window days"):
    print(f"[{d.metadata['source']}] {d.page_content[:80]}...")
print("-" * 100)
