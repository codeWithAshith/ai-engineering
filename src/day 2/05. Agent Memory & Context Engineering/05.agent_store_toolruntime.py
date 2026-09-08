# 05 — Store + ToolRuntime on the order-support agent
#
# Concept: create_agent(..., store=...) + ToolRuntime lets tools put/search memory.
#
# Limitation overcome: Store alone is not wired into the ORD-* agent tools.
# Still limited: long chats still need summarization / compaction.
#
# Example: save preference, new thread recalls it (same customer namespace idea).

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool
from langgraph.store.memory import InMemoryStore

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}
store = InMemoryStore()


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def save_pref(key: str, value: str, runtime: ToolRuntime) -> str:
    """Save a customer preference (survives new threads)."""
    runtime.store.put(("customers", "cust-42"), key, {"value": value})
    return f"Saved {key}={value}"


@tool
def get_prefs(runtime: ToolRuntime) -> str:
    """List saved customer preferences."""
    items = list(runtime.store.search(("customers", "cust-42")))
    if not items:
        return "No preferences saved."
    return ", ".join(f"{i.key}={i.value['value']}" for i in items)


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, save_pref, get_prefs],
    store=store,
)

print("thread A — save pref")
r1 = agent.invoke(
    {"messages": [HumanMessage(content="Save preference contact=email for me.")]},
    config={"configurable": {"thread_id": "support-A"}},
)
print(r1["messages"][-1].content)
print("-" * 100)

print("thread B — recall pref (new thread_id)")
r2 = agent.invoke(
    {"messages": [HumanMessage(content="What contact preference is saved?")]},
    config={"configurable": {"thread_id": "support-B"}},
)
print(r2["messages"][-1].content)
print("-" * 100)
