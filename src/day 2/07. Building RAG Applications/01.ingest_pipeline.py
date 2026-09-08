# 01 — Ingestion pipeline
#
# Concept: scan a folder → Document(page_content, metadata) for Acme policies.
# Apps add path/type metadata for ops (dedup, ACL later).
#
# Limitation overcome: fundamentals loaded files ad hoc; apps need a reusable ingest step.
# Still limited: raw files may need section parsing before chunking.

from pathlib import Path

from langchain_core.documents import Document

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"


def ingest_directory(folder: Path) -> list[Document]:
    out: list[Document] = []
    for path in sorted(folder.glob("*.txt")):
        out.append(
            Document(
                page_content=path.read_text(encoding="utf-8").strip(),
                metadata={"source": path.name, "path": str(path), "type": "text"},
            )
        )
    return out


docs = ingest_directory(DATA)
print(f"ingested {len(docs)} from {DATA}")
for d in docs:
    print(f"  {d.metadata['source']} ({len(d.page_content)} chars)")
print("-" * 100)
