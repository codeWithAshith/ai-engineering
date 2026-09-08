# 04 — Long-term memory (Store)
#
# Concept: LangGraph Store holds structured facts across threads.
#   checkpointer (Day 1) = chat state for one thread_id
#   store (Day 2)        = user/company facts reused on new threads
#
# Limitation overcome: trim/checkpointer cannot remember "email me, don't call"
# after a new support thread starts.
# Still limited: agents need ToolRuntime to read/write the store from tools.
#
# Example: save contact preference for customer of ORD-1, load on a new thread.

from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
namespace = ("customers", "cust-42")

store.put(namespace, "contact", {"value": "email", "note": "no phone calls"})
store.put(namespace, "last_order", {"value": "ORD-1"})

print("saved facts:")
for item in store.search(namespace):
    print(f"  {item.key} = {item.value}")

# New support thread — no chat history, but store still has facts
print("new thread can load:", store.get(namespace, "contact").value)
print("-" * 100)
