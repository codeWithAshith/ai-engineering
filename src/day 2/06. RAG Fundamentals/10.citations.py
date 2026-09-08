# 10 — Citations
#
# Concept: return the answer plus source metadata from retrieved chunks.
#
# Limitation overcome: grounded text without sources is hard to audit on ORD-* tickets.
# Example: answer + policy file names.
# Still limited: fundamentals stop here — apps module builds fuller pipelines.

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
            "You are Acme order support. Use ONLY this context.\n\n{context}",
        ),
        ("human", "{question}"),
    ]
)
chain = prompt | init_chat_model(model="groq:openai/gpt-oss-20b") | StrOutputParser()

question = "Who do I email about ORD tickets?"
hits = retriever.invoke(question)
context = "\n\n".join(d.page_content for d in hits)
answer = chain.invoke({"context": context, "question": question})
sources = sorted({d.metadata["source"] for d in hits})

print("answer:", answer)
print("sources:", sources)
print("-" * 100)
