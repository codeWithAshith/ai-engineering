# 07 — Default middleware
#
# Concept: middleware wraps model/tool calls on create_agent.
# Demo each built-in separately (same ORDERS domain):
#
#   A) ToolErrorMiddleware      — tool raises → error ToolMessage → model recovers
#   B) ToolCallLimitMiddleware  — too many tool calls → ToolCallLimitExceededError
#   C) ModelCallLimitMiddleware — too many model calls → ModelCallLimitExceededError
#   D) HumanInTheLoopMiddleware — pause before a WRITE tool; resume with approve
#
# Example: order support ORD-1 / ORD-999.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import (
    HumanInTheLoopMiddleware,
    ModelCallLimitMiddleware,
    ToolCallLimitMiddleware,
    ToolErrorMiddleware,
)
from langchain.agents.middleware.tool_call_limit import ToolCallLimitExceededError
from langchain.agents.middleware.model_call_limit import ModelCallLimitExceededError
from langchain.messages import HumanMessage
from langchain.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    if order_id not in ORDERS:
        raise ValueError(f"Order {order_id} not found")
    return ORDERS[order_id]


@tool
def update_order_status(order_id: str, status: str) -> str:
    """WRITE: change order status (needs approval)."""
    if order_id not in ORDERS:
        raise ValueError(f"Order {order_id} not found")
    ORDERS[order_id] = status
    return f"Updated {order_id} → {status}"


@tool
def ping(x: str) -> str:
    """Demo tool for call limits. Call it when asked to ping."""
    return f"pong:{x}"


# --- A) ToolErrorMiddleware ---
print("A) ToolErrorMiddleware — unknown order raises, agent recovers:")
err_agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order],
    system_prompt="Use lookup_order. Do not invent statuses.",
    middleware=[
        ToolErrorMiddleware(
            on_error=lambda exc, _req: f"ERROR: {type(exc).__name__}: {exc}"
        )
    ],
)
print(
    err_agent.invoke({"messages": [HumanMessage(content="Status of ORD-999?")]})[
        "messages"
    ][-1].content
)
print("-" * 100)

# --- B) ToolCallLimitMiddleware ---
print("B) ToolCallLimitMiddleware — run_limit=1, exit_behavior='error':")
tool_limit_agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[ping],
    system_prompt="You must call ping at least twice with different args before any final answer.",
    middleware=[ToolCallLimitMiddleware(run_limit=1, exit_behavior="error")],
)
try:
    tool_limit_agent.invoke({"messages": [HumanMessage(content="Ping a then b.")]})
except ToolCallLimitExceededError as e:
    print("  caught:", type(e).__name__, "—", e)
print("-" * 100)

# --- C) ModelCallLimitMiddleware ---
print("C) ModelCallLimitMiddleware — run_limit=1 (blocks the follow-up model call):")
model_limit_agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order],
    system_prompt="Always use lookup_order for status questions.",
    middleware=[ModelCallLimitMiddleware(run_limit=1, exit_behavior="error")],
)
try:
    # 1st model call plans tools; limit=1 → cannot call the model again after tools
    model_limit_agent.invoke({"messages": [HumanMessage(content="Status of ORD-1?")]})
except ModelCallLimitExceededError as e:
    print("  caught:", type(e).__name__, "—", e)
print("-" * 100)

# --- D) HumanInTheLoopMiddleware ---
print("D) HumanInTheLoopMiddleware — pause WRITE, then approve:")
hitl_agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[update_order_status],
    system_prompt="Use update_order_status when the user asks to change status.",
    checkpointer=MemorySaver(),
    middleware=[
        HumanInTheLoopMiddleware(interrupt_on={"update_order_status": True})
    ],
)
cfg = {"configurable": {"thread_id": "hitl-demo"}}
paused = hitl_agent.invoke(
    {"messages": [HumanMessage(content="Set ORD-1 to delivered.")]},
    config=cfg,
)
print("  paused:", paused.get("__interrupt__") is not None)
done = hitl_agent.invoke(
    Command(resume={"decisions": [{"type": "approve"}]}),
    config=cfg,
)
print("  after approve:", done["messages"][-1].content)
print("  store:", ORDERS)
print("-" * 100)
