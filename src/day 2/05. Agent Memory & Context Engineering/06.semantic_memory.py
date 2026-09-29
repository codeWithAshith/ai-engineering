# 06 — Semantic memory (facts, searched by meaning)
#
# Concept: semantic memory is a fact about the user, not a transcript.
#   "Email me. Do not call." is a fact. The chat that produced it is not.
#   You store the fact. A later question finds it by meaning, not by the exact key.
#
# Evolution of this idea:
#   2022: ConversationEntityMemory extracted people and preferences into a dict.
#   2023: the same facts were stuffed back into the prompt by hand.
#   2024–present: LangGraph Store holds the fact. search(query=...) ranks by embedding.
#   Takeaway: the fact outlives the thread. The key does not have to match the question.
#
# Example: cust-42 prefers email. A new thread asks "how should we reach them?"

import math

from langgraph.store.memory import InMemoryStore

VOCAB = ["email", "phone", "call", "contact", "refund", "late", "ship"]


def embed(texts: list[str]) -> list[list[float]]:
    """Tiny bag-of-words embedder so this file runs without an embedding API."""
    vectors = []
    for text in texts:
        words = text.lower().replace(".", " ").split()
        raw = [float(sum(token in word for word in words)) for token in VOCAB]
        norm = math.sqrt(sum(value * value for value in raw)) or 1.0
        vectors.append([value / norm for value in raw])
    return vectors


store = InMemoryStore(index={"embed": embed, "dims": len(VOCAB), "fields": ["text"]})
namespace = ("customers", "cust-42")

store.put(namespace, "contact", {"text": "Contact by email. Do not call."})
store.put(namespace, "shipping", {"text": "Last order ORD-1 has shipped."})

print("═" * 100)
print("SEMANTIC MEMORY — fact, not the chat")
print("═" * 100)
print("Stored: Contact by email. Do not call.")
print()

question = "Do we call this customer or email them?"
hits = store.search(namespace, query=question, limit=1)
top = hits[0]
print(f"Question: {question}")
print(f"Hit: {top.value['text']}")
print("-" * 100)
