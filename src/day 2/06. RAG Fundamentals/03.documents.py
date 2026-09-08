# 03 — Documents
#
# Concept: Document = page_content + metadata (source for citations later).
#
# Limitation overcome: without structured docs, policy text is a pile of strings.
# Example: load Acme order-support policy files.
# Still limited: whole files are too big to embed as one unit — need chunking.

from pathlib import Path

from langchain_core.documents import Document

DATA = Path(__file__).parent / "data"

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]

print(f"loaded {len(docs)} policy docs")
for d in docs:
    print(f"  {d.metadata['source']}: {len(d.page_content)} chars")
print("-" * 100)
