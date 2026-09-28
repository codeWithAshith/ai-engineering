# 04 — How a tool should look
#
# The model reads three fields: name, description, args.
# One job per tool. The docstring says when to call it, and when not to.

from langchain.messages import ToolMessage
from langchain.tools import tool
from pydantic import BaseModel, Field

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def support_action(action: str, order_id: str, amount: float = None) -> str:
    """Handle support actions."""
    if action == "lookup":
        return ORDERS.get(order_id, "not found")
    if action == "refund":
        return f"Refunded ${amount} on {order_id}"
    return "Unknown action"


@tool
def lookup_order_status(order_id: str) -> str:
    """Look up one order by id. Use for "where is my order?". Not for refunds."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


class RefundInput(BaseModel):
    order_id: str = Field(description="Order id like ORD-1")
    amount: float = Field(gt=0, le=500, description="Refund amount in USD, max 500")


@tool(args_schema=RefundInput)
def issue_refund(order_id: str, amount: float) -> str:
    """Refund a shipped order after the customer asked. Not for a status question."""
    if order_id not in ORDERS:
        return f"ERROR: Order {order_id} not found"
    return f"Refunded ${amount:.2f} on {order_id} (was {ORDERS[order_id]})"


def dump(fn):
    print("name:", fn.name)
    print("description:", fn.description)
    print("args:", fn.args)
    print("-" * 40)


dump(support_action)
dump(lookup_order_status)
dump(issue_refund)

# What the executor sends back after the tool runs.
# Not the model's answer. The return value, tied to the call that asked for it.
tool_message = ToolMessage(content="shipped", name="lookup_order_status", tool_call_id="call_abc123")
print("ToolMessage:")
print("  type:", tool_message.type)
print("  name:", tool_message.name)
print("  tool_call_id:", tool_message.tool_call_id)
print("  content:", tool_message.content)
