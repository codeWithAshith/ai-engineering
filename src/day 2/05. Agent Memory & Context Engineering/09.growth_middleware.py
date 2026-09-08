# 09 — Growth strategies via middleware
#
# Concept: lesson 08's ladder, wired on one order-support create_agent:
#
# | Strategy   | How (middleware / agent)                                      |
# |------------|---------------------------------------------------------------|
# | Trim       | SummarizationMiddleware keep=("messages", N)                  |
# | Compact    | ContextEditingMiddleware + ClearToolUsesEdit (old tool dumps) |
# | Summarize  | SummarizationMiddleware trigger → LLM summary of older turns  |
# | Store      | create_agent(..., store=...) + ToolRuntime prefs tools        |
# | Retrieve   | get_prefs / lookup_order tools (pull only what you need)      |
#
# Limitation overcome: doing trim/summarize/compact by hand each call is easy to miss.
# Example: ORD-* agent with all five wired together.
#
# ```mermaid
# flowchart LR
#   msg[messages] --> mid[middleware]
#   mid --> model
#   store[(Store)] -.-> tools
#   tools --> model
# ```

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import (
    ClearToolUsesEdit,
    ContextEditingMiddleware,
    SummarizationMiddleware,
)
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool
from langgraph.checkpoint.memory import MemorySaver
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
    """Save a customer preference (long-term Store)."""
    runtime.store.put(("customers", "cust-42"), key, {"value": value})
    return f"Saved {key}={value}"


@tool
def get_prefs(runtime: ToolRuntime) -> str:
    """Retrieve saved customer preferences from Store."""
    items = list(runtime.store.search(("customers", "cust-42")))
    if not items:
        return "No preferences saved."
    return ", ".join(f"{i.key}={i.value['value']}" for i in items)


# Low thresholds so students can see the wiring; raise in production.
agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, save_pref, get_prefs],
    store=store,  # Store + Retrieve (via tools)
    checkpointer=MemorySaver(),
    middleware=[
        # Summarize old turns when message count grows; keep recent N (trim)
        SummarizationMiddleware(
            model="groq:openai/gpt-oss-20b",
            trigger=("messages", 8),
            keep=("messages", 4),
        ),
        # Compact: clear older tool results when context gets large
        ContextEditingMiddleware(
            edits=[
                ClearToolUsesEdit(
                    trigger=2000,
                    keep=2,
                    placeholder="[old tool result cleared]",
                )
            ],
        ),
    ],
)

cfg = {"configurable": {"thread_id": "support-growth"}}

print("1) store pref")
print(
    agent.invoke(
        {"messages": [HumanMessage(content="Save preference contact=email.")]},
        config=cfg,
    )["messages"][-1].content
)
print("-" * 100)

print("2) retrieve pref + lookup ORD-1")
print(
    agent.invoke(
        {
            "messages": [
                HumanMessage(
                    content="What contact preference is saved? Also status of ORD-1?"
                )
            ]
        },
        config=cfg,
    )["messages"][-1].content
)
print("-" * 100)

print("3) more turns (middleware may trim/summarize/compact as limits hit)")
for i in range(4):
    r = agent.invoke(
        {
            "messages": [
                HumanMessage(content=f"Follow-up {i}: any update on ORD-1 shipping?")
            ]
        },
        config=cfg,
    )
    print(f"  turn {i}: {r['messages'][-1].content[:80]}...")
print("-" * 100)
print("middleware attached: SummarizationMiddleware + ContextEditingMiddleware")
print("store tools: save_pref / get_prefs | status tool: lookup_order")
print("-" * 100)
