# 08 — RAG with LangChain (LCEL chain)
#
# Concept: one composed chain for Acme policy Q&A (retriever | prompt | model).
#
# Limitation overcome: piecemeal scripts are hard to reuse in a support service.
# Still limited: fixed retrieve→generate path — no branching / tools yet.

from pathlib import Path

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
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
retriever = InMemoryVectorStore.from_documents(
    RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs),
    embedding=embeddings,
).as_retriever(search_kwargs={"k": 3})

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "Acme order support. Use ONLY:\n{context}"),
        ("human", "{question}"),
    ]
)


def format_docs(docs: list[Document]) -> str:
    return "\n\n".join(d.page_content for d in docs)


rag = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | init_chat_model(model="groq:openai/gpt-oss-20b")
    | StrOutputParser()
)

print(rag.invoke("What is the refund window?"))
print("-" * 100)
