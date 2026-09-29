# 07 — Episodic memory (what happened last time)
#
# Concept: an episode is one past case: situation, action, outcome.
#   Semantic memory says "email me".
#   An episode says "ticket TKT-42, late ORD-1, we refunded, customer was satisfied."
#   A new ticket recalls the similar case, not a standing preference.
#
# Evolution of this idea:
#   2022: the whole chat log was the only record of what happened.
#   2023: people pasted "last time we did X" into the system prompt by hand.
#   2024–present: each episode is one Store item. search() returns the closest past case.
#   Takeaway: keep the case. Do not keep the full transcript.
#
# Example: a late shipment was refunded. A new late-shipment ticket should find that case.

import math

from langgraph.store.memory import InMemoryStore

VOCAB = ["late", "refund", "ship", "address", "wrong", "email", "policy"]


def embed(texts: list[str]) -> list[list[float]]:
    vectors = []
    for text in texts:
        words = text.lower().replace(".", " ").split()
        raw = [float(sum(token in word for word in words)) for token in VOCAB]
        norm = math.sqrt(sum(value * value for value in raw)) or 1.0
        vectors.append([value / norm for value in raw])
    return vectors


store = InMemoryStore(index={"embed": embed, "dims": len(VOCAB), "fields": ["text"]})
namespace = ("episodes", "support")

store.put(
    namespace,
    "tkt-42",
    {"text": "Late shipment of ORD-1. Action: refunded. Outcome: customer satisfied."},
)
store.put(
    namespace,
    "tkt-18",
    {"text": "Wrong address on ORD-9. Action: updated address. Outcome: resent."},
)

print("═" * 100)
print("EPISODIC MEMORY — the past case")
print("═" * 100)

question = "Package is late. What did we do last time?"
hits = store.search(namespace, query=question, limit=1)
print(f"Question: {question}")
print(f"Hit: {hits[0].key} — {hits[0].value['text']}")
print("-" * 100)
