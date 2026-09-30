# 02 — Index
#
# Load, chunk, embed, store. Same embedding model as the question later.

from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

DATA = Path(__file__).parent / "data"
docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
chunks = RecursiveCharacterTextSplitter(chunk_size=160, chunk_overlap=40).split_documents(docs)
embeddings = OllamaEmbeddings(model="nomic-embed-text")
store = InMemoryVectorStore.from_documents(chunks, embedding=embeddings)

print(f"{len(docs)} docs → {len(chunks)} chunks")
print(chunks[0].metadata["source"], chunks[0].page_content[:80].replace("\n", " "))
print("dims", len(embeddings.embed_query("refund window")))
print("indexed", len(chunks))
