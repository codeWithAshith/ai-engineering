# 06 — Vector store
#
# Concept: store chunk embeddings for later similarity search.
#
# Limitation overcome: loose vectors in memory lists do not support ranked retrieval.
# Example: index Acme policy chunks into InMemoryVectorStore.
# Still limited: store alone does not answer — need search + generation.

from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

DATA = Path(__file__).parent / "data"
embeddings = OllamaEmbeddings(model="nomic-embed-text")

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
chunks = RecursiveCharacterTextSplitter(chunk_size=160, chunk_overlap=40).split_documents(
    docs
)
store = InMemoryVectorStore.from_documents(chunks, embedding=embeddings)
print(f"indexed {len(chunks)} policy chunks")
print("-" * 100)
