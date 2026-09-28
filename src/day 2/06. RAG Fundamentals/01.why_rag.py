# 01 — Why RAG (Retrieval-Augmented Generation)
#
# Concept: LLMs lack private / fresh policy knowledge. RAG retrieves YOUR docs at
# query time and grounds the answer in actual sources.
#
# Where this came from:
#   Lewis et al., "Retrieval-Augmented Generation," 2020: retrieve passages, then generate.
#   Fine-tuning bakes facts into weights. A policy change means another training run, and no citation.
#   Stuffing the whole policy into the prompt hits the context window.
#   This course uses RAG for Acme policies because the docs can change and the answer can name the file.
#
# Day 1 ORDERS dict can answer "status of ORD-1" (structured lookup) but NOT:
#   "What is the refund window?" / "How long is standard shipping?"
#   → These require unstructured policy documents, where RAG excels.
#
# ```mermaid
# flowchart LR
#   A[Customer question] --> B[Embed question]
#   B --> C[Search vector store]
#   C --> D[Retrieve top K chunks]
#   D --> E[Inject into prompt]
#   E --> F[LLM generates grounded answer]
#   F --> G[Return + cite sources]
# ```

# ════════════════════════════════════════════════════════════════════════════
# PART 1: The problem RAG solves
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: The RAG problem space")
print("═" * 100)
print("Without RAG, LLM support agents face 3 core limitations:")
print()
print("1. PRIVATE DATA:")
print("   • Your refund policy is not in GPT training data")
print("   • Model cannot answer 'What is Acme's refund window?'")
print()
print("2. STALE KNOWLEDGE:")
print("   • Policy changes from 30 → 45 days")
print("   • Training data cutoff means model gives outdated answer")
print()
print("3. NO CITATIONS:")
print("   • Customer asks for proof")
print("   • Model cannot cite official policy document")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: RAG architecture (index-time vs query-time)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 2: RAG two-phase architecture")
print("═" * 100)
print("INDEX-TIME (once per document update):")
print("  1. Load documents (refund_policy.txt, shipping_policy.txt)")
print("  2. Chunk into smaller pieces (160 chars, 40 overlap)")
print("  3. Embed each chunk → vector")
print("  4. Store vectors in vector database (InMemoryVectorStore)")
print()
print("QUERY-TIME (every customer question):")
print("  1. Embed question → query vector")
print("  2. Similarity search → top K chunks")
print("  3. Inject chunks into prompt context")
print("  4. LLM generates grounded answer")
print("  5. Return answer + cite sources")
print()
print("Same corpus through this folder: refund_policy / shipping_policy / contacts")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 3: RAG vs Fine-Tuning vs Structured Lookup
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 3: Choosing the right approach")
print("═" * 100)
print("| Approach           | When to use                                  | Example                         |")
print("|--------------------|----------------------------------------------|---------------------------------|")
print("| Structured Lookup  | Tiny structured data, fast DB queries        | ORDERS['ORD-1'] → 'shipped'     |")
print("| RAG                | Private/fresh docs, need citations           | Refund policy, shipping times   |")
print("| Fine-Tuning        | Style/format/behavior, NOT facts             | Tone of voice, response format  |")
print()
print("Order-support decision tree:")
print("  ✓ 'Status of ORD-1?'       → Day 1 structured tool (ORDERS dict)")
print("  ✓ 'Refund window?'         → Day 2 RAG over policy docs")
print("  ✓ 'Respond professionally' → System prompt or fine-tune")
print()
print("RAG WINS when you need:")
print("  ✓ Up-to-date facts (update docs, not retrain model)")
print("  ✓ Citations (link to source document)")
print("  ✓ Private data (your policies, not public training data)")
print("  ✓ Cost-effective scaling (embed once, query many times)")
print()
print("FINE-TUNING WINS when you need:")
print("  ✓ Behavioral changes (tone, format, structure)")
print("  ✓ Domain-specific jargon (medical, legal terms)")
print("  ✓ Compress knowledge INTO weights (not retrieval)")
print()
print("HYBRID approach:")
print("  • RAG for facts (policy documents)")
print("  • Fine-tune for style (professional tone)")
print("  • Structured tools for lookups (order status)")
print("-" * 100)

print("═" * 100)
print("NEXT LESSONS:")
print("═" * 100)
print("02. rag_pipeline_index.py   → Build the indexing pipeline")
print("03. rag_pipeline_query.py   → Build the query pipeline")
print("04. grounded_answers.py     → Inject context into prompts")
print("05. citations.py            → Link answers to sources")
print("-" * 100)
