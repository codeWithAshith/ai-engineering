# 02 — Parse sections
#
# Concept: split policy text into titled sections before chunking.
#
# Limitation overcome: whole-file ingest loses structure (title / section).
# Example: blank-line sections on Acme policy docs.
# Still limited: sections may still be long — chunk with metadata next.

from pathlib import Path

from langchain_core.documents import Document

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"


def parse_sections(path: Path) -> list[Document]:
    text = path.read_text(encoding="utf-8").strip()
    parts = [p.strip() for p in text.split("\n\n") if p.strip()]
    docs: list[Document] = []
    for i, part in enumerate(parts):
        title = part.split("\n", 1)[0][:80]
        docs.append(
            Document(
                page_content=part,
                metadata={"source": path.name, "section": i, "title": title},
            )
        )
    return docs


parsed = []
for path in sorted(DATA.glob("*.txt")):
    parsed.extend(parse_sections(path))

print(f"sections={len(parsed)}")
for d in parsed[:4]:
    print(f"  [{d.metadata['source']}] {d.metadata['title']!r}")
print("-" * 100)
