# 02 — RAG indexing pipeline (load → chunk → embed → store)
#
# Concept: Transform raw policy documents into searchable vector representations.
# This is INDEX-TIME (once per document update), not query-time.
#
# Pipeline stages:
#   1. Load documents (page_content + metadata for citations)
#   2. Chunk into smaller pieces (fit embedding + retrieval)
#   3. Embed chunks (text → vectors via nomic-embed-text)
#   4. Store vectors (InMemoryVectorStore for quick similarity search)
#
# What this file actually does:
#   Document is page_content plus metadata. RecursiveCharacterTextSplitter splits on paragraphs and sentences, not on a fixed character offset.
#   The same embedding model must be used for chunks and for the question later.
#   Semantic chunkers and parent-child chunkers exist. This file does not use them.
#   Takeaway: Chunking strategy matters more than embedding model choice.
#
# Limitation overcome: without structured docs, policy text is unindexed and unsearchable.
# Example: Acme order-support policy files (refund, shipping, contacts).
# Still limited: indexed store cannot answer questions yet — need query pipeline (next lesson).
#
# ```mermaid
# flowchart LR
#   A[Policy files] --> B[Load as Documents]
#   B --> C[Chunk with metadata]
#   C --> D[Embed chunks]
#   D --> E[Store in vector DB]
#   E --> F[Ready for similarity search]
# ```

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Load documents with metadata
# ════════════════════════════════════════════════════════════════════════════

from pathlib import Path

from langchain_core.documents import Document

DATA = Path(__file__).parent / "data"

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]

print("═" * 100)
print("PART 1: Load documents")
print("═" * 100)
print(f"Loaded {len(docs)} policy documents")
for d in docs:
    print(f"  {d.metadata['source']}: {len(d.page_content)} chars")
print()
print("Document structure:")
print("  • page_content: full policy text")
print("  • metadata: {'source': filename} (for citations later)")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Chunk documents
# ════════════════════════════════════════════════════════════════════════════

from langchain_text_splitters import RecursiveCharacterTextSplitter

# Why chunk?
#   - Whole files too big for embedding context
#   - Smaller chunks = more precise retrieval ("refund window" not mixed with shipping)
#   - Overlap preserves context across boundaries

splitter = RecursiveCharacterTextSplitter(
    chunk_size=160,  # Chars per chunk (tune based on embedding model + use case)
    chunk_overlap=40,  # Overlap to preserve context at boundaries
)
chunks = splitter.split_documents(docs)

print("═" * 100)
print("PART 2: Chunk documents")
print("═" * 100)
print(f"Documents: {len(docs)} → Chunks: {len(chunks)}")
print()
print("Sample chunks:")
for c in chunks[:3]:
    preview = c.page_content[:70].replace('\n', ' ')
    print(f"  [{c.metadata['source']}] {preview!r}...")
print()
print("Chunking parameters:")
print(f"  chunk_size={splitter._chunk_size} chars")
print(f"  chunk_overlap={splitter._chunk_overlap} chars")
print()
print("Why these values?")
print("  • 160 chars ≈ 40 tokens (rough estimate)")
print("  • 40 char overlap = ~10 tokens (preserve sentence context)")
print("  • Tune based on: embedding model limits, retrieval precision needs")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 3: Embed chunks (text → vectors)
# ════════════════════════════════════════════════════════════════════════════

from dotenv import load_dotenv
from langchain_ollama import OllamaEmbeddings

load_dotenv()

# Why embeddings?
#   - Text cannot be ranked by semantic similarity
#   - Vectors enable "refund window" to match "45-day return policy"
#   - Same embedding model for index-time (documents) and query-time (questions)

embeddings = OllamaEmbeddings(model="nomic-embed-text")

# Demo: embed one chunk + one question
sample_chunk = chunks[0].page_content
sample_question = "How many days is the refund window?"

v_doc = embeddings.embed_documents([sample_chunk])[0]
v_query = embeddings.embed_query(sample_question)

print("═" * 100)
print("PART 3: Embed chunks")
print("═" * 100)
print("Embedding model: nomic-embed-text (local via Ollama)")
print(f"Vector dimension: {len(v_doc)}")
print()
print("Sample vectors:")
print(f"  Chunk: {[round(x, 4) for x in v_doc[:3]]}... ({len(v_doc)} dims)")
print(f"  Query: {[round(x, 4) for x in v_query[:3]]}... ({len(v_query)} dims)")
print()
print("Key concepts:")
print("  • embed_documents(chunks) → batch embed for index-time")
print("  • embed_query(question)   → single embed for query-time")
print("  • Same model for both! (else similarity search breaks)")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 4: Store vectors for similarity search
# ════════════════════════════════════════════════════════════════════════════

from langchain_core.vectorstores import InMemoryVectorStore

# Build vector store from chunks
# .from_documents:
#   1. Embeds all chunks
#   2. Stores (chunk_text, vector, metadata)
#   3. Ready for similarity_search(question)

store = InMemoryVectorStore.from_documents(chunks, embedding=embeddings)

print("═" * 100)
print("PART 4: Store vectors")
print("═" * 100)
print(f"Indexed {len(chunks)} policy chunks into InMemoryVectorStore")
print()
print("What's stored:")
print("  • Chunk text (page_content)")
print("  • Chunk vector (embedded representation)")
print("  • Metadata (source file for citations)")
print()
print("Vector store options:")
print("  • InMemoryVectorStore (demo, ephemeral)")
print("  • ChromaDB (persistent, local)")
print("  • FAISS (fast, C++ backend)")
print("  • Pinecone/Weaviate (managed, cloud)")
print()
print("Production choice:")
print("  Start with InMemory for prototyping")
print("  Switch to Chroma/FAISS when you need persistence")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# SUMMARY: Index pipeline complete
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("INDEX PIPELINE COMPLETE")
print("═" * 100)
print("✓ Step 1: Loaded 3 policy documents")
print(f"✓ Step 2: Chunked into {len(chunks)} pieces (160 chars, 40 overlap)")
print(f"✓ Step 3: Embedded chunks with nomic-embed-text ({len(v_doc)} dims)")
print(f"✓ Step 4: Stored in vector database (InMemoryVectorStore)")
print()
print("Index ready for queries!")
print("Next lesson: 03.rag_pipeline_query.py → search + retrieve + answer")
print("-" * 100)
