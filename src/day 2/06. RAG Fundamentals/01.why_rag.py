# 01 — Why RAG (order-support)
#
# Concept: LLMs lack private / fresh policy knowledge. RAG retrieves YOUR docs at
# query time and grounds the answer.
#
# Day 1 ORDERS dict can answer "status of ORD-1" but NOT:
#   "What is the refund window?" / "How long is standard shipping?"
#
# Use RAG when you need grounded answers from policy docs, updatable without retrain,
# and citations.
#
# Flow: question → retrieve policy chunks → prompt + context → model → grounded answer
