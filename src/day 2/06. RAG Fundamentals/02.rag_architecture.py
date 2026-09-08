# 02 — RAG architecture
#
# Concept: index-time vs query-time for Acme order-support policies.
#
# Index-time:  documents → chunk → embed → vector store
# Query-time:  question → embed → similarity search → prompt → answer
#
# Same corpus through this folder: refund_policy / shipping_policy / contacts.
