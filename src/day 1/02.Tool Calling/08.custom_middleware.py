# 08 — Custom middleware
#
# Concept: @wrap_tool_call intercepts each tool call.
#   (request, handler) → result = handler(request) → return result
# You can log (or later change) what happened around the real tool.
#
# Example: one custom middleware — audit log for lookup_order / ORD-1.

from collections.abc import Callable

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain.messages import HumanMessage, ToolMessage
from langchain.tools import tool
from langchain.tools.tool_node import ToolCallRequest

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}
AUDIT: list[str] = []


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@wrap_tool_call
def audit_tool_calls(
    request: ToolCallRequest,
    handler: Callable[[ToolCallRequest], ToolMessage],
) -> ToolMessage:
    result = handler(request)
    AUDIT.append(
        f"{request.tool_call['name']}({request.tool_call['args']}) → {result.content}"
    )
    return result


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order],
    system_prompt="Order support. Use lookup_order for status questions.",
    middleware=[audit_tool_calls],
)

print(
    agent.invoke({"messages": [HumanMessage(content="Status of ORD-1?")]})[
        "messages"
    ][-1].content
)
print("-" * 100)
print("AUDIT:", AUDIT)
print("-" * 100)
