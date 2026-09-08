# 03 — Chunk with metadata
#
# Concept: chunk_size / overlap while preserving source (and section) metadata.
#
# Limitation overcome: parsed sections can still exceed embed size.
# Example: chunk Acme policies; every chunk keeps source for citations.
# Still limited: chunks need indexing behind a retriever API.

from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
chunks = RecursiveCharacterTextSplitter(
    chunk_size=140, chunk_overlap=30
).split_documents(docs)

print(f"chunks={len(chunks)}")
assert all("source" in c.metadata for c in chunks)
print("sample:", chunks[0].metadata, "→", chunks[0].page_content[:60]!r)
print("-" * 100)
