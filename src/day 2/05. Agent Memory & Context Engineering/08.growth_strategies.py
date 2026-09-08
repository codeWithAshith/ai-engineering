# 08 — Managing context growth (strategy ladder)
#
# Concept: apply strategies in order as the ORD-* thread grows.
#
#   1. Trim      — keep last N / token budget (lesson 03)
#   2. Compact   — shorten tool dumps (lesson 07)
#   3. Summarize — LLM summary of old turns (lesson 06)
#   4. Store     — move stable facts to Store (lessons 04–05)
#   5. Retrieve  — pull only relevant memory/docs when needed (RAG modules)
#
# Day 1 already: checkpointer persists the thread; it does not shrink what the model sees.
# Still limited: the ladder is manual — next lesson wires it with middleware.
