# 08 — Procedural memory (how to do the job next time)
#
# Concept: procedural memory is an instruction, not a fact and not a past case.
#   Semantic: "email this customer."
#   Episodic: "last late order was refunded."
#   Procedural: "When a shipment is late, offer the refund before asking them to wait."
#   The next run reads that line into the system prompt.
#
# Evolution of this idea:
#   2022: the system prompt was a string you edited in the file.
#   2023: teams versioned prompts outside the agent and pasted the winner back in.
#   2024–present: the Store can hold the current instruction. The agent loads it on the next thread.
#   Takeaway: the behavior changes because the instruction changed, not because the chat was longer.
#
# Example: after a bad late-order reply, save a better rule and load it for the next ticket.

from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
namespace = ("procedures", "order-support")

store.put(
    namespace,
    "late-shipment",
    {"text": "Greet the customer, then look up the order."},
)

print("═" * 100)
print("PROCEDURAL MEMORY — the rule for next time")
print("═" * 100)
print("Before:", store.get(namespace, "late-shipment").value["text"])

store.put(
    namespace,
    "late-shipment",
    {"text": "When a shipment is late, offer the refund before asking them to wait."},
)

rule = store.get(namespace, "late-shipment").value["text"]
system_prompt = f"You handle order support.\nStanding rule: {rule}"

print("After: ", rule)
print()
print("Next thread system prompt:")
print(system_prompt)
print("-" * 100)
