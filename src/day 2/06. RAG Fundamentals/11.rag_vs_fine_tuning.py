# 11 — RAG vs fine-tuning
#
# Concept: choose the right way to teach the model Acme policies.
#
# | Approach     | When                                                      |
# |--------------|-----------------------------------------------------------|
# | RAG          | Facts change, need citations, private docs (this folder)  |
# | Fine-tune    | Style/format/behavior; not a substitute for live policies |
# | ORDERS dict  | Tiny structured lookups (Day 1 status tool)               |
#
# Order-support rule of thumb:
#   status of ORD-1     → tool / DB (Day 1)
#   refund window       → RAG over policy docs (Day 2)
#   tone of voice       → fine-tune or system prompt
