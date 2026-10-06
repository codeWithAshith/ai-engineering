# 12 — Iterative retrieval
#
# Same two-part ticket as 09. Retrieve, check coverage, refine, retrieve again.
# Stops when refund + contacts are both found, or max rounds hit.
#
# Why / when this is required:
#   First pass often covers only part of a multi-part ticket (INCOMPLETE).
#   Instead of (or after) guessing all sub-asks up front, loop:
#     retrieve → see which sources you have → ask for ONE new query → retrieve again.
#   Use when coverage checks fail (expected contacts, only got refund), or when
#   you prefer react-on-miss over always decomposing every message.
#
# Vs 09 decompose:
#   08 splits the question first, then retrieves each part (plan ahead).
#   11 retrieves first, then fills gaps (recover after a miss).
#
# Not required for a single clear ask that already returns enough sources.
# Full failure map: 01.rag_failure_analysis.py

from pathlib import Path

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
MAX_ROUNDS = 3
NEEDED = {"refund_policy.txt", "contacts.txt"}
QUESTION = (
    "If I return ORD-88421, how long until the refund hits my card, and who do I email about the ticket?"
)


def ingest(folder: Path) -> InMemoryVectorStore:
    docs = [
        Document(page_content=path.read_text(encoding="utf-8").strip(), metadata={"source": path.name})
        for path in sorted(folder.glob("*.txt"))
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    print(f"ingest {len(docs)} docs → {len(chunks)} chunks")
    return InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))


store = ingest(DATA)
refiner = (
    ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(
                "Given the ticket and policy files already found, suggest ONE new search query "
                "for the missing part. Return ONLY the query."
            ),
            HumanMessagePromptTemplate.from_template(
                "Ticket: {question}\nSources found: {sources}"
            ),
        ]
    )
    | init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
    | StrOutputParser()
)

query = QUESTION
collected: list[Document] = []
seen_sources: set[str] = set()

print("-" * 40)
print("ticket:", QUESTION)
for round_num in range(1, MAX_ROUNDS + 1):
    for hit in store.similarity_search(query, k=2):
        if hit.metadata["source"] not in seen_sources:
            seen_sources.add(hit.metadata["source"])
            collected.append(hit)
    print(f"round {round_num} query: {query}")
    print(f"  sources so far: {sorted(seen_sources)}")
    if NEEDED.issubset(seen_sources):
        break
    query = refiner.invoke({"question": QUESTION, "sources": ", ".join(sorted(seen_sources)) or "none"})

print(f"final {len(collected)} chunks from {sorted(seen_sources)}")
print("-" * 40)
