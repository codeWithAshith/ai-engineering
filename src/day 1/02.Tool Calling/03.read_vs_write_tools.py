# 03 — Read vs write tools
#
# Concept: label tools by risk / side effects.
#   READ  — lookup_order (no side effects; safe to retry)
#   WRITE — update_order_status (changes store state)
#
# Example: check ORD-2, then set ORD-2 to shipped.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def lookup_order(order_id: str) -> str:
    """READ: fetch order status. Safe to call anytime."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def update_order_status(order_id: str, status: str) -> str:
    """WRITE: change order status. Only when the user asks to update."""
    if order_id not in ORDERS:
        return f"Order {order_id} not found"
    ORDERS[order_id] = status
    return f"Updated {order_id} → {status}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, update_order_status],
    system_prompt=(
        "Order support. Use lookup_order to check status. "
        "Use update_order_status only when the user asks to change status."
    ),
)

print("READ:")
print(
    agent.invoke({"messages": [HumanMessage(content="Status of ORD-2?")]})[
        "messages"
    ][-1].content
)
print("store:", ORDERS)
print("-" * 100)

print("WRITE:")
print(
    agent.invoke({"messages": [HumanMessage(content="Set order ORD-2 to shipped.")]})[
        "messages"
    ][-1].content
)
print("store:", ORDERS)
print("-" * 100)
