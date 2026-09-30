# 05 — RAG evaluation
#
# ingest, query, and answer are written here. One RAG path.
# evaluate checks that the expected file is in the query text.
# judge scores whether the reply stays on that text.

from pathlib import Path

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"
FALLBACK = "I don't have policy context for that. Email help@acme.example."
POLICY_HINTS = ("refund", "ship", "email", "vip", "express", "ord", "delivery", "contact")
PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", "Acme order support. Answer from this policy text only:\n{context}"),
        ("human", "{question}"),
    ]
)
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b")
JUDGE = ChatPromptTemplate.from_messages(
    [
        ("system", "Rate grounding, accuracy, and completeness from 1 to 5. Return JSON."),
        ("user", "Context:\n{context}\n\nQuestion: {question}\n\nAnswer: {answer}"),
    ]
)
CASES = [
    ("What is the refund window?", "refund_policy.txt"),
    ("How long is standard shipping?", "shipping_policy.txt"),
    ("What are your support hours?", "contacts.txt"),
    ("Can I cancel my order?", "refund_policy.txt"),
    ("Do you ship internationally?", "shipping_policy.txt"),
]


def ingest(folder: Path) -> InMemoryVectorStore:
    docs = [
        Document(page_content=path.read_text(encoding="utf-8").strip(), metadata={"source": path.name})
        for path in sorted(folder.glob("*.txt"))
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    return InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))


def query(store: InMemoryVectorStore, question: str) -> str:
    if not any(hint in question.lower() for hint in POLICY_HINTS):
        return FALLBACK
    hits = store.similarity_search(question, k=3)
    if not hits:
        return FALLBACK
    sources = sorted({hit.metadata["source"] for hit in hits})
    context = "\n\n".join(f"[{hit.metadata['source']}] {hit.page_content}" for hit in hits)
    return f"sources: {sources}\n{context}"


def answer(store: InMemoryVectorStore, question: str) -> str:
    found = query(store, question)
    if found == FALLBACK:
        return FALLBACK
    sources, context = found.split("\n", 1)
    reply = (PROMPT | MODEL).invoke({"context": context, "question": question})
    return f"{reply.content}\n{sources}"


def evaluate(store: InMemoryVectorStore, cases: list[tuple[str, str]]) -> str:
    correct = 0
    for question, expected in cases:
        found = query(store, question)
        hit = expected in found
        correct += hit
        print(f"  {question}")
        print(f"  expected {expected}  {'yes' if hit else 'no'}")
    return f"{correct}/{len(cases)}"


def judge(store: InMemoryVectorStore, question: str) -> str:
    found = query(store, question)
    if found == FALLBACK:
        return FALLBACK
    _, context = found.split("\n", 1)
    reply = answer(store, question).rsplit("\n", 1)[0]
    return (JUDGE | MODEL).invoke({"context": context, "question": question, "answer": reply}).content


store = ingest(DATA)

print("example 1")
print("question: What is the refund window?")
print(answer(store, "What is the refund window?"))
print("-" * 40)

print("example 2")
print("question: quantum widget warranty on Mars")
print(answer(store, "quantum widget warranty on Mars"))
print("-" * 40)

print("evaluate")
print(evaluate(store, CASES))
print("-" * 40)

print("judge")
print("question: What is the refund window?")
print(judge(store, "What is the refund window?"))
print("-" * 40)
