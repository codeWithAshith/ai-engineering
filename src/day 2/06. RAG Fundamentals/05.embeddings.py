# 05 — Embeddings
#
# Concept: embed_documents for index-time; embed_query for the question.
#
# Uses local Ollama model nomic-embed-text.
#
# Limitation overcome: string chunks cannot be ranked by meaning without vectors.
# Still limited: vectors need a store to search at scale.

from langchain_ollama import OllamaEmbeddings

emb = OllamaEmbeddings(model="nomic-embed-text")

chunk = "Customers may request a refund within 45 days of delivery."
question = "How many days is the refund window?"

v_doc = emb.embed_documents([chunk])[0]
v_q = emb.embed_query(question)
print("doc vector dim:", len(v_doc), "first3:", [round(x, 4) for x in v_doc[:3]])
print("query vector dim:", len(v_q), "first3:", [round(x, 4) for x in v_q[:3]])
print("-" * 100)
