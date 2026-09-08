# 10 — Tool governance (RBAC)
#
# Concept: governance is enforced when a tool runs — not by building
# a separate create_agent per role.
#   context.role (from invoke) says who is calling
#   @wrap_tool_call allows or blocks the tool
#
# Example: viewer blocked from issue_refund; agent allowed.

from collections.abc import Callable
from dataclasses import dataclass

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain.messages import HumanMessage, ToolMessage
from langchain.tools import tool
from langchain.tools.tool_node import ToolCallRequest

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

ALLOWED = {
    "viewer": {"lookup_order"},
    "agent": {"lookup_order", "issue_refund"},
}


@dataclass
class Context:
    role: str


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def issue_refund(order_id: str, amount: float) -> str:
    """Issue a refund."""
    return f"Refunded ${amount:.2f} on {order_id}"


@wrap_tool_call
def enforce_rbac(
    request: ToolCallRequest,
    handler: Callable[[ToolCallRequest], ToolMessage],
) -> ToolMessage:
    role = "viewer"
    if request.runtime and request.runtime.context is not None:
        role = request.runtime.context.role
    name = request.tool_call["name"]
    if name not in ALLOWED.get(role, set()):
        return ToolMessage(
            content=f"ERROR: role={role} is not allowed to call {name}",
            tool_call_id=request.tool_call["id"],
        )
    return handler(request)


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, issue_refund],
    context_schema=Context,
    middleware=[enforce_rbac],
    system_prompt="Order support. Use tools when needed.",
)

print("viewer — refund (should be blocked):")
print(
    agent.invoke(
        {"messages": [HumanMessage(content="Refund $10 on ORD-1")]},
        context=Context(role="viewer"),
    )["messages"][-1].content
)
print("-" * 100)

print("agent — refund (allowed):")
print(
    agent.invoke(
        {"messages": [HumanMessage(content="Refund $10 on ORD-1")]},
        context=Context(role="agent"),
    )["messages"][-1].content
)
print("-" * 100)
