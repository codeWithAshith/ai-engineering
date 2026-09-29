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
