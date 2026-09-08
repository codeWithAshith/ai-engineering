# 07 — Similarity search
#
# Concept: embed the question, rank chunks by vector similarity.
#
# Limitation overcome: a vector store with no query path cannot find refund vs shipping.
# Example: "refund window" should surface refund_policy chunks.
# Still limited: raw hits are not yet a clean retriever API or grounded answer.

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

# similarity_search:
#   1) embeds the query string with the same embedding model
#   2) compares that query vector to stored chunk vectors
#   3) returns the nearest chunks
# k = how many top matches to return (here: best 2 chunks)
hits = store.similarity_search("What is the refund window?", k=2)
for h in hits:
    print(f"[{h.metadata['source']}] {h.page_content[:90]}...")
print("-" * 100)
