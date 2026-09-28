# 03 — Agent Store (long-term memory across threads)
#
# Concept: LangGraph Store holds structured facts that survive thread restarts.
#   checkpointer (Day 1) = chat history for ONE thread_id
#   store (Day 2)        = user/company facts shared across ALL threads
#
# Where this came from:
#   A checkpointer (Day 1) saves one thread. It does not share "email me" across new thread ids.
#   People kept that in their own database and passed it into the prompt by hand.
#   LangGraph's Store (2024, with the graph library) is a namespaced key/value beside the checkpointer.
#   ToolRuntime.store lets a tool read and write that store during a call.
#
# Limitation overcome: trim_messages and checkpointers can't remember preferences
# after a new support thread starts (e.g., "email me, don't call").
#
# Example: save contact preference for customer of ORD-1, recall on new thread.

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Store basics (put/get/search)
# ════════════════════════════════════════════════════════════════════════════

from langgraph.store.memory import InMemoryStore

store = InMemoryStore()

# Namespace: organizes facts by scope (customers, orders, policies, etc.)
namespace = ("customers", "cust-42")

# Save structured facts
store.put(namespace, "contact", {"value": "email", "note": "no phone calls"})
store.put(namespace, "last_order", {"value": "ORD-1"})
store.put(namespace, "vip_status", {"value": True, "tier": "gold"})

print("═" * 100)
print("PART 1: Store basics")
print("═" * 100)
print(f"Namespace: {namespace}")
print()
print("Saved facts:")
for item in store.search(namespace):
    print(f"  {item.key} = {item.value}")
print("-" * 100)

# New support thread (different thread_id) — chat history is gone, but Store persists
print("NEW THREAD (no chat history, but Store still has facts):")
contact_pref = store.get(namespace, "contact")
print(f"  Loaded: contact={contact_pref.value}")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Store + ToolRuntime in agent
# ════════════════════════════════════════════════════════════════════════════

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}
store = InMemoryStore()  # Fresh store for agent demo


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def save_pref(key: str, value: str, runtime: ToolRuntime) -> str:
    """
    Save a customer preference (long-term Store, survives new threads).
    
    Use when customer says:
    - "Email me, don't call"
    - "Prefer chat support"
    - "Always ship express"
    """
    runtime.store.put(("customers", "cust-42"), key, {"value": value})
    return f"Saved {key}={value}"


@tool
def get_prefs(runtime: ToolRuntime) -> str:
    """
    List all saved customer preferences from Store.
    
    Use when:
    - Starting a new support thread
    - Customer asks "what do you have on file?"
    """
    items = list(runtime.store.search(("customers", "cust-42")))
    if not items:
        return "No preferences saved."
    return ", ".join(f"{i.key}={i.value['value']}" for i in items)


print("═" * 100)
print("PART 2: Store + ToolRuntime in agent")
print("═" * 100)

agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, save_pref, get_prefs],
    store=store,  # Wire Store into agent
    system_prompt=(
        "You are order support. "
        "Use save_pref to remember customer preferences across sessions. "
        "Use get_prefs to recall what's saved."
    ),
)

print("Thread A — Save preference:")
r1 = agent.invoke(
    {"messages": [HumanMessage(content="Save preference contact=email for me.")]},
    config={"configurable": {"thread_id": "support-A"}},
)
print(f"  → {r1['messages'][-1].content}")
print("-" * 100)

print("Thread B — Recall preference (NEW thread_id, no chat history):")
r2 = agent.invoke(
    {"messages": [HumanMessage(content="What contact preference is saved?")]},
    config={"configurable": {"thread_id": "support-B"}},  # Different thread!
)
print(f"  → {r2['messages'][-1].content}")
print("-" * 100)

print("Thread C — Combine Store + status lookup:")
r3 = agent.invoke(
    {
        "messages": [
            HumanMessage(content="Status of ORD-1? Also what's my contact pref?")
        ]
    },
    config={"configurable": {"thread_id": "support-C"}},
)
print(f"  → {r3['messages'][-1].content}")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("STORE vs CHECKPOINTER")
print("═" * 100)
print("| Feature | Checkpointer (Day 1) | Store (Day 2) |")
print("|---------|----------------------|---------------|")
print("| Scope | One thread_id | All threads (by namespace) |")
print("| Data | Chat messages + state | Structured facts (key/value) |")
print("| Lifetime | Thread duration | Permanent (until deleted) |")
print("| Use case | Conversation continuity | User prefs, company policies |")
print()
print("WHEN TO USE STORE:")
print("  ✓ Customer preferences (contact method, shipping address)")
print("  ✓ Company policies (refund windows, shipping times)")
print("  ✓ User profiles (VIP status, purchase history)")
print("  ✓ Facts that span multiple conversations")
print()
print("WHEN TO USE CHECKPOINTER:")
print("  ✓ Chat history for one support session")
print("  ✓ Resuming interrupted conversations")
print("  ✓ Multi-turn context within one thread")
print("-" * 100)
