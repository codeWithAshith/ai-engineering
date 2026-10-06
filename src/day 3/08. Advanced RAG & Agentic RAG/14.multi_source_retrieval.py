# 14 — Multi-source retrieval
#
# Real desk setup: policies live in one index, contacts in another
# (separate teams / ACLs / refresh schedules). Query each, then merge.
#
# Why / when this is required:
#   One flat store is not how companies ship knowledge. Refund text may sit in
#   a policy wiki; VIP email/phone in a contacts CRM. A single index either
#   mixes permissions or misses a whole desk.
#   Use when corpora are owned separately, refreshed on different clocks,
#   or must not share the same ACL — still one ticket that needs both.
#
# Not required when everything already lives in one small index with one ACL
# (your early ladder files). Full failure map: 01.rag_failure_analysis.py

from pathlib import Path

from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"

# Two-part ticket: needs refund timing (policies) AND who to email (contacts).
QUESTION = (
    "If I return ORD-88421, how long until the refund hits my card, and who do I email about the ticket?"
)


def build_store(files: list[Path], corpus: str) -> InMemoryVectorStore:
    docs = [
        Document(
            page_content=path.read_text(encoding="utf-8").strip(),
            metadata={"source": path.name, "corpus": corpus},
        )
        for path in files
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    print(f"ingest [{corpus}] {len(docs)} docs → {len(chunks)} chunks")
    return InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))


# Separate indexes — like policy wiki vs contacts CRM in production.
stores = {
    "policies": build_store(
        [DATA / "refund_policy.txt", DATA / "shipping_policy.txt"],
        "policies",
    ),
    "contacts": build_store([DATA / "contacts.txt"], "contacts"),
}


def search_one(corpus: str, question: str, k: int = 2) -> list[Document]:
    return stores[corpus].similarity_search(question, k=k)


def search_all(question: str, k_per_source: int = 2) -> list[Document]:
    seen: set[int] = set()
    merged: list[Document] = []
    for corpus in stores:
        for hit in search_one(corpus, question, k=k_per_source):
            key = hash(hit.page_content)
            if key not in seen:
                seen.add(key)
                merged.append(hit)
    return merged


def show(label: str, hits: list[Document]) -> None:
    print(label)
    print("-" * 60)
    if not hits:
        print("  (no hits)")
        print()
        return
    for hit in hits:
        text = hit.page_content.replace("\n", " ")
        print(f"  [{hit.metadata['corpus']}] {hit.metadata['source']}")
        print(f"  {text}")
        print()


print("=" * 60)
print("ticket:", QUESTION)
print()

# Show each desk alone — policies alone miss the email; contacts alone miss the timeline.
show("1) POLICIES index only (refund / shipping wiki)", search_one("policies", QUESTION, k=2))
show("2) CONTACTS index only (CRM / support directory)", search_one("contacts", QUESTION, k=2))

# Production path: fan out to every allowed source, then merge for the answerer.
merged = search_all(QUESTION, k_per_source=2)
show("3) MULTI-SOURCE merge (both desks — what the agent should see)", merged)

sources = sorted({hit.metadata["source"] for hit in merged})
print("coverage check:")
print(f"  sources found: {sources}")
print(f"  has refund_policy? {'refund_policy.txt' in sources}")
print(f"  has contacts?     {'contacts.txt' in sources}")
print("=" * 60)
