# 09 — Growth middleware
#
# Saver, summary, and store on one agent. Clear old tool results too.

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
    """Save a customer preference."""
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
    checkpointer=MemorySaver(),
    system_prompt="You are order support. Use save_pref, get_prefs, and lookup_order.",
    middleware=[
        # SummarizationMiddleware rewrites this thread before the model call.
        # After 8 messages, older turns become one note. The last 4 stay in full.
        # The checkpointer still holds the chat. This only changes what is sent.
        SummarizationMiddleware(
            model="groq:openai/gpt-oss-20b",
            trigger=("messages", 8),
            keep=("messages", 4),
        ),
        # ContextEditingMiddleware edits the messages already in the thread.
        # ClearToolUsesEdit clears old tool results once they pass the token trigger.
        # keep=2 leaves the two newest tool results. Older ones become the placeholder.
        # The preference itself is in the store, so clearing a tool dump does not delete it.
        ContextEditingMiddleware(
            edits=[ClearToolUsesEdit(trigger=2000, keep=2, placeholder="[old tool result cleared]")]
        ),
    ],
)

cfg = {"configurable": {"thread_id": "support-growth"}}
for text in (
    "Save preference contact=email.",
    "What contact preference is saved? Also status of ORD-1?",
):
    reply = agent.invoke({"messages": [HumanMessage(content=text)]}, config=cfg)
    print(reply["messages"][-1].content)
