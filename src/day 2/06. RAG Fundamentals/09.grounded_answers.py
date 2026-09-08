# 09 — Grounded answers
#
# Concept: retriever → context → prompt → model; answer ONLY from policy context.
#
# Limitation overcome: retrieval alone does not produce a customer-facing reply.
# Example: refund window question grounded in Acme docs.
# Still limited: answers without listed sources are hard to trust in support UIs.

from pathlib import Path

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
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
retriever = InMemoryVectorStore.from_documents(
    chunks, embedding=embeddings
).as_retriever(search_kwargs={"k": 3})

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are Acme order support. Use ONLY this policy context. "
            "If missing, say you don't know.\n\n{context}",
        ),
        ("human", "{question}"),
    ]
)
model = init_chat_model(model="groq:openai/gpt-oss-20b")
chain = prompt | model | StrOutputParser()

question = "What is the refund window?"
context = "\n\n".join(d.page_content for d in retriever.invoke(question))
print(chain.invoke({"context": context, "question": question}))
print("-" * 100)
