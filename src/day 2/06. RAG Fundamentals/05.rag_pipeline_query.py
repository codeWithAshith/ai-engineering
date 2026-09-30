# 05 — Query
#
# similarity_search embeds the question with the same model as the chunks,
# compares that vector to the stored vectors, and returns the k nearest documents.
# It is a method on the store. k=2 keeps the two closest passages.
#
# as_retriever() wraps that search as a runnable. invoke(question) returns documents.
# A chain can call the retriever without holding the store.
# search_kwargs={"k": 2} is the same k.
# Both calls assign hits first. The next files then join hits into context.

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
store = InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))

question = "What is the refund window?"
hits = store.similarity_search(question, k=2)
for hit in hits:
    print(hit.metadata["source"], hit.page_content[:90].replace("\n", " "))

retriever = store.as_retriever(search_kwargs={"k": 2})
question = "How long is standard shipping for ORD orders?"
hits = retriever.invoke(question)
for hit in hits:
    print(hit.metadata["source"], hit.page_content[:90].replace("\n", " "))
