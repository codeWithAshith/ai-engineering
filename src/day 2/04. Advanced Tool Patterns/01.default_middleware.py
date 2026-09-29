# 01 — Default middleware
#
# Middleware is a wrapper you pass in a list. The agent function stays the same.
#
#   A) ToolErrorMiddleware      — a raised error becomes a tool message
#   B) ToolCallLimitMiddleware  — stop after too many tool calls
#   C) ModelCallLimitMiddleware — stop after too many model calls
#
# A person approving a write is the next file, on its own.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import (
    ModelCallLimitMiddleware,
    ToolCallLimitMiddleware,
    ToolErrorMiddleware,
)
from langchain.agents.middleware.tool_call_limit import ToolCallLimitExceededError
from langchain.agents.middleware.model_call_limit import ModelCallLimitExceededError
from langchain.messages import HumanMessage
from langchain.tools import tool

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    if order_id not in ORDERS:
        raise ValueError(f"Order {order_id} not found")
    return ORDERS[order_id]


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
