# 11 — Advanced chunking + vector tuning (parent-child)
#
# Same return ticket. Search small child chunks (precise hit), return the
# parent policy file (richer context for generation).
# Also show Top-K tuning: too small misses; too large adds noise.
#
# Why / when parent-child is required:
#   Small chunks match the query well but starve the LLM of surrounding policy.
#   Large chunks match poorly or dump whole files into the prompt.
#   Child = search unit (precise). Parent = generation unit (full policy section).
#   Use when eval shows: right document, wrong/incomplete sentence (chunking fault).
#
# Why / when Top-K / vector tuning is required:
#   Low recall → try larger K, better embedder, or different child size.
#   Low precision / noise → try smaller K (then rerank 04 / filter 05).
#   Do not raise K "just in case" — more noise and cost.
#
# Not required when docs are already short (one idea per file).
# Full failure map: 01.rag_failure_analysis.py

from pathlib import Path
from uuid import uuid4

from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
QUESTION = "Can I return ORD-88421 and get money back to my card?"
# Vector tuning knobs (change these when recall/precision eval fails):
EMBEDDING_MODEL = "nomic-embed-text"
CHILD_SIZE = 100
CHILD_OVERLAP = 20
TOP_K_TIGHT = 2
TOP_K_WIDE = 5


def ingest(folder: Path) -> tuple[dict[str, Document], InMemoryVectorStore]:
    parents: dict[str, Document] = {}
    children: list[Document] = []
    for path in sorted(folder.glob("*.txt")):
        parent_id = str(uuid4())
        parent = Document(
            page_content=path.read_text(encoding="utf-8").strip(),
            metadata={"source": path.name, "parent_id": parent_id},
        )
        parents[parent_id] = parent
        for index, chunk in enumerate(
            RecursiveCharacterTextSplitter(
                chunk_size=CHILD_SIZE, chunk_overlap=CHILD_OVERLAP
            ).split_text(parent.page_content)
        ):
            children.append(
                Document(
                    page_content=chunk,
                    metadata={"source": path.name, "parent_id": parent_id, "child_index": index},
                )
            )
    print(f"ingest {len(parents)} parents → {len(children)} children")
    print(f"vector tuning: embedder={EMBEDDING_MODEL} child_size={CHILD_SIZE} overlap={CHILD_OVERLAP}")
    store = InMemoryVectorStore.from_documents(
        children, embedding=OllamaEmbeddings(model=EMBEDDING_MODEL)
    )
    return parents, store


def show_parents(label: str, child_hits: list[Document], parents: dict[str, Document]) -> None:
    print(label)
    seen: set[str] = set()
    for hit in child_hits:
        preview = hit.page_content.replace("\n", " ")[:60]
        print(f"  child[{hit.metadata['child_index']}] {hit.metadata['source']}: {preview}...")
        parent_id = hit.metadata["parent_id"]
        if parent_id in seen:
            continue
        seen.add(parent_id)
        parent = parents[parent_id]
        print(f"  parent → {parent.metadata['source']} ({len(parent.page_content)} chars)")


parents, store = ingest(DATA)

print("=" * 40)
print("ticket:", QUESTION)

# === NEW: Top-K tuning (same index, different K) ===
print("=== NEW: vector tuning — Top-K ===")
show_parents(f"  k={TOP_K_TIGHT} (tight — risk missing a line)", store.similarity_search(QUESTION, k=TOP_K_TIGHT), parents)
show_parents(f"  k={TOP_K_WIDE} (wide — more recall, more noise)", store.similarity_search(QUESTION, k=TOP_K_WIDE), parents)

# === KEEP: parent-child for generation context ===
print("=== advanced chunking: child hit → full parent ===")
child_hits = store.similarity_search(QUESTION, k=TOP_K_TIGHT)
seen: set[str] = set()
for hit in child_hits:
    parent_id = hit.metadata["parent_id"]
    if parent_id in seen:
        continue
    seen.add(parent_id)
    parent = parents[parent_id]
    print(f"  parent ({parent.metadata['source']}):")
    print(f"    {parent.page_content}")
print("=" * 40)
