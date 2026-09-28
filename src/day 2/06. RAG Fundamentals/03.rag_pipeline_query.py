# 03 — RAG query pipeline (embed query → search → retrieve)
#
# Concept: Transform customer questions into relevant policy chunks.
# This is QUERY-TIME (every customer question), not index-time.
#
# Pipeline stages:
#   1. Embed question (text → vector with SAME model as index-time)
#   2. Similarity search (find chunks with closest vectors)
#   3. Retrieve via stable Retriever API (returns list[Document])
#
# Two ways to ask the same index:
#   store.similarity_search(q, k=2) is the vector store's own method.
#   store.as_retriever() is the LangChain runnable: question in, documents out, so a chain does not import the store type.
#   Rerankers and hybrid search are extra retrievers. This file is the basic one.
#
# Why Retriever matters:
#   store.similarity_search(q, k=2)  — ties you to THIS vector store's API
#   retriever.invoke(q)              — stable interface for LangChain components
#
# When to use Retriever:
#   ✓ Piping into LCEL chains (next section: RAG Applications)
#   ✓ Swapping stores (InMemory → Chroma) without changing call sites
#   ✓ Baking config (k, filters) in one place, not copied everywhere
#
# Limitation overcome: raw vector stores don't compose cleanly with chains/graphs.
# Example: Acme policy retrieval via both similarity_search and Retriever.
# Still limited: retrieved chunks are not yet an answer — need grounding (next lesson).
#
# ```mermaid
# flowchart LR
#   A[Customer question] --> B[Embed question]
#   B --> C[Similarity search]
#   C --> D[Top K chunks]
#   D --> E[Retriever.invoke]
#   E --> F[Return list of Documents]
# ```

# ════════════════════════════════════════════════════════════════════════════
# SETUP: Index pipeline (from lesson 02)
# ════════════════════════════════════════════════════════════════════════════

from pathlib import Path

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

DATA = Path(__file__).parent / "data"
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# Rebuild index (in production, you'd load a persisted store)
docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
chunks = RecursiveCharacterTextSplitter(
    chunk_size=160, chunk_overlap=40
).split_documents(docs)
store = InMemoryVectorStore.from_documents(chunks, embedding=embeddings)

print("═" * 100)
print("SETUP: Index ready (from lesson 02)")
print("═" * 100)
print(f"Indexed {len(chunks)} policy chunks")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Similarity search (low-level vector store API)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: Similarity search (vector store API)")
print("═" * 100)

question = "What is the refund window?"

# similarity_search steps:
#   1. Embed the question with same model as index-time
#   2. Compare question vector to all stored chunk vectors
#   3. Return top K chunks by cosine similarity (or other metric)

hits = store.similarity_search(question, k=2)

print(f"Question: {question}")
print(f"Top {len(hits)} chunks:")
for h in hits:
    preview = h.page_content[:90].replace('\n', ' ')
    print(f"  [{h.metadata['source']}] {preview}...")
print()
print("How it works:")
print("  1. question → embed_query() → query_vector")
print("  2. cosine_similarity(query_vector, all_chunk_vectors)")
print("  3. sort by similarity score, return top k")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Retriever interface (composable API)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 2: Retriever interface (stable API for chains)")
print("═" * 100)

# Create retriever from vector store
# .as_retriever() wraps similarity_search with:
#   - Stable interface (invoke/batch/stream)
#   - Config baked in (k, filters, score threshold)
#   - Compatible with LCEL chains

retriever = store.as_retriever(
    search_kwargs={"k": 2}  # Bake k into retriever config
)

docs_retrieved = retriever.invoke("How long is standard shipping for ORD orders?")

print("Question: How long is standard shipping for ORD orders?")
print(f"Retrieved {len(docs_retrieved)} documents:")
for d in docs_retrieved:
    preview = d.page_content[:90].replace('\n', ' ')
    print(f"  [{d.metadata['source']}] {preview}...")
print()
print("Why use Retriever instead of similarity_search?")
print()
print("BENEFIT 1: Stable interface for LangChain components")
print("  • retriever | prompt | model → LCEL chain")
print("  • Works with any retriever (vector, keyword, hybrid)")
print()
print("BENEFIT 2: Swap stores without changing call sites")
print("  • Change InMemory → Chroma")
print("  • retriever.invoke(q) still works (no code changes)")
print()
print("BENEFIT 3: Config in one place")
print("  • search_kwargs={'k': 2, 'score_threshold': 0.7}")
print("  • No copying k=2 everywhere in your code")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 3: Advanced retriever options
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 3: Advanced retriever patterns")
print("═" * 100)
print("Beyond basic similarity search:")
print()
print("1. SIMILARITY SCORE THRESHOLD")
print("   retriever = store.as_retriever(")
print("       search_type='similarity_score_threshold',")
print("       search_kwargs={'score_threshold': 0.7, 'k': 5}")
print("   )")
print("   → Only return chunks above 0.7 similarity")
print()
print("2. MMR (Maximum Marginal Relevance)")
print("   retriever = store.as_retriever(")
print("       search_type='mmr',")
print("       search_kwargs={'k': 5, 'fetch_k': 20, 'lambda_mult': 0.5}")
print("   )")
print("   → Diversify results (avoid returning 5 similar chunks)")
print()
print("3. METADATA FILTERING")
print("   retriever = store.as_retriever(")
print("       search_kwargs={'filter': {'source': 'refund_policy.txt'}}")
print("   )")
print("   → Only search within specific policy file")
print()
print("4. HYBRID SEARCH (coming in advanced lessons)")
print("   • Combine vector similarity + keyword search")
print("   • Best of both: semantic meaning + exact term matches")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# SUMMARY: Query pipeline complete
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("QUERY PIPELINE COMPLETE")
print("═" * 100)
print("✓ Step 1: Embed question (same model as index-time)")
print("✓ Step 2: Similarity search (cosine similarity, top K)")
print("✓ Step 3: Retriever.invoke (stable interface)")
print()
print("Retrieved chunks ready for grounding!")
print("Next lessons:")
print("  04. grounded_answers.py → Inject context into LLM prompts")
print("  05. citations.py        → Link answers to source documents")
print("-" * 100)
