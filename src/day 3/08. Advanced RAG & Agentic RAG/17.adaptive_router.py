# 17 — Adaptive router (placeholder)
#
# Complexity → which strategy.
# Idea: a thin router (rules or LLM) looks at the ticket and picks a path:
#   chitchat     → skip search (13)
#   messy slang  → rewrite (07) or HyDE (15)
#   one need     → hybrid → rerank (04–05)
#   two needs    → decompose (09) or iterative (12)
#   multi-corpus → multi-source (14)
#
# Discussed as a LangGraph shape earlier; not shipped as a lesson file yet.
# This placeholder is where that router demo will live.
#
# Full failure map: 01.rag_failure_analysis.py
