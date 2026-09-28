# 01 — Production RAG setup (complete ingestion pipeline)
#
# Concept: Complete end-to-end pipeline for indexing Acme policy documents.
# Combines all ingestion steps into ONE reusable production setup.
#
# Pipeline stages:
#   1. Ingest directory → list[Document] with metadata
#   2. Parse sections (optional, for structured docs)
#   3. Chunk with metadata preservation
#   4. Index and create retriever
#
# Evolution of RAG Ingestion:
#   2022: Manual scripts per project → no reuse
#   2023 Q1: Copy-paste ingest functions → fragile
#   2023 Q3: LangChain DocumentLoaders → standardized interfaces
#   2024-Present: Pipeline composition → chunk_and_index(load(folder))
#   Takeaway: Production RAG = composable pipeline, not ad-hoc scripts.
#
# Why this matters:
#   - Micro-step demos (lessons 01-04 in audit) teach concepts
#   - Production needs ONE pipeline: folder → retriever
#   - Metadata preservation critical for citations + ACL
#
# ```mermaid
# flowchart TD
#   A[Policy folder] --> B[Ingest directory]
#   B --> C[Parse sections optional]
#   C --> D[Chunk with metadata]
#   D --> E[Embed + store]
#   E --> F[Create retriever]
#   F --> G[Ready for queries]
# ```

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Ingest directory (folder → Documents)
# ════════════════════════════════════════════════════════════════════════════

from pathlib import Path

from langchain_core.documents import Document

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"


def ingest_directory(folder: Path) -> list[Document]:
    """
    Scan folder for .txt files → list[Document] with metadata.
    
    Metadata includes:
      - source: filename (for citations)
      - path: full path (for ACL checks)
      - type: file type (for multi-format pipelines)
    """
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

print("═" * 100)
print("PART 1: Ingest directory")
print("═" * 100)
print(f"Ingested {len(docs)} documents from {DATA}")
for d in docs:
    print(f"  {d.metadata['source']} ({len(d.page_content)} chars)")
print()
print("Metadata structure:")
print(f"  source: {docs[0].metadata['source']}")
print(f"  path:   {docs[0].metadata['path']}")
print(f"  type:   {docs[0].metadata['type']}")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Parse sections (optional, for structured docs)
# ════════════════════════════════════════════════════════════════════════════


def parse_sections(path: Path) -> list[Document]:
    """
    Split policy text into titled sections (by blank lines).
    
    Adds section metadata:
      - section: numeric index
      - title: first line of section (truncated)
    
    Use when:
      ✓ Docs have clear section boundaries
      ✓ Want section-level retrieval precision
      ✗ Skip if docs are already chunked or unstructured
    """
    text = path.read_text(encoding="utf-8").strip()
    parts = [p.strip() for p in text.split("\n\n") if p.strip()]
    docs_out: list[Document] = []
    for i, part in enumerate(parts):
        title = part.split("\n", 1)[0][:80]
        docs_out.append(
            Document(
                page_content=part,
                metadata={"source": path.name, "section": i, "title": title},
            )
        )
    return docs_out


parsed = []
for path in sorted(DATA.glob("*.txt")):
    parsed.extend(parse_sections(path))

print("═" * 100)
print("PART 2: Parse sections (optional)")
print("═" * 100)
print(f"Parsed into {len(parsed)} sections")
print()
print("Sample sections:")
for d in parsed[:4]:
    print(f"  [{d.metadata['source']}] section {d.metadata['section']}: {d.metadata['title']!r}")
print()
print("When to use section parsing:")
print("  ✓ Policies with clear headings (Refund Policy, Shipping Times)")
print("  ✓ Want retrieval at section granularity")
print("  ✗ Skip if already structured or need paragraph-level chunks")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 3: Chunk with metadata preservation
# ════════════════════════════════════════════════════════════════════════════

from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load fresh for chunk demo (or use `docs` from Part 1)
docs_for_chunking = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]

chunks = RecursiveCharacterTextSplitter(
    chunk_size=140,  # Smaller than fundamentals (demo readability)
    chunk_overlap=30,
).split_documents(docs_for_chunking)

print("═" * 100)
print("PART 3: Chunk with metadata")
print("═" * 100)
print(f"Chunked {len(docs_for_chunking)} docs → {len(chunks)} chunks")
print()
print("Metadata preservation:")
assert all("source" in c.metadata for c in chunks), "Metadata lost!"
print(f"  Sample chunk metadata: {chunks[0].metadata}")
print(f"  Sample chunk content: {chunks[0].page_content[:60]!r}...")
print()
print("Why metadata matters:")
print("  ✓ Citations: link answer to source file")
print("  ✓ ACL: filter chunks by user permissions")
print("  ✓ Debugging: trace retrieved chunks back to origin")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 4: Index and create retriever
# ════════════════════════════════════════════════════════════════════════════

from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings

embeddings = OllamaEmbeddings(model="nomic-embed-text")

# Create vector store from chunks (embeds all chunks)
retriever = InMemoryVectorStore.from_documents(
    chunks, embedding=embeddings
).as_retriever(
    search_kwargs={"k": 2}  # Bake retrieval config
)

print("═" * 100)
print("PART 4: Index + retriever")
print("═" * 100)
print(f"Indexed {len(chunks)} chunks")
print(f"Retriever config: k={2} (top 2 chunks per query)")
print()
print("Test query:")
hits = retriever.invoke("refund window days")
for d in hits:
    preview = d.page_content[:80].replace('\n', ' ')
    print(f"  [{d.metadata['source']}] {preview}...")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PRODUCTION PATTERNS
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PRODUCTION RAG SETUP PATTERNS")
print("═" * 100)
print()
print("PATTERN 1: Simple folder ingestion")
print("  docs = ingest_directory(folder)")
print("  chunks = splitter.split_documents(docs)")
print("  retriever = store.from_documents(chunks).as_retriever()")
print()
print("PATTERN 2: Section-aware chunking")
print("  sections = [parse_sections(p) for p in folder.glob('*.txt')]")
print("  chunks = splitter.split_documents(sections)")
print("  retriever = store.from_documents(chunks).as_retriever()")
print()
print("PATTERN 3: Multi-format ingestion")
print("  from langchain_community.document_loaders import PDFLoader, CSVLoader")
print("  docs = PDFLoader(pdf_path).load() + CSVLoader(csv_path).load()")
print("  chunks = splitter.split_documents(docs)")
print("  retriever = store.from_documents(chunks).as_retriever()")
print()
print("NEXT LESSONS:")
print("  02. prompt_composition.py  → Inject context into LLM prompts")
print("  03. no_result_handling.py  → Handle empty retrieval gracefully")
print("  04. source_attribution.py  → Link answers to source documents")
print("-" * 100)
