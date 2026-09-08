# 04 — Chunking
#
# Concept: split documents so each chunk fits embedding + retrieval.
#
# Limitation overcome: whole policy files are too coarse for precise answers.
# Example: chunk Acme refund / shipping / contacts docs.
# Still limited: chunks are text only — need vectors to search by meaning.

from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA = Path(__file__).parent / "data"

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
splitter = RecursiveCharacterTextSplitter(chunk_size=160, chunk_overlap=40)
chunks = splitter.split_documents(docs)

print(f"docs={len(docs)} → chunks={len(chunks)}")
for c in chunks[:3]:
    print(f"  [{c.metadata['source']}] {c.page_content[:70]!r}...")
print("-" * 100)
