# 02 — Tool errors and validation
#
# Concept: tools should fail clearly.
#   args_schema — Pydantic model on @tool so args are typed/described for the model
#   Bad INPUT  — validate and return an ERROR string
#   Bad DATA   — missing order — return an ERROR string
# Returning an error keeps the agent running (no crash).
#
# Example: issue_refund on ORD-1 / ORD-999 with invalid amount or unknown id.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool
from pydantic import BaseModel, Field, ValidationError

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class RefundInput(BaseModel):
    order_id: str = Field(min_length=1, description="Order id like ORD-1")
    amount: float = Field(gt=0, le=500, description="USD, max 500")


@tool(args_schema=RefundInput)
def issue_refund(order_id: str, amount: float) -> str:
    """Issue a refund. amount must be > 0 and <= 500. order must exist."""
    try:
        RefundInput(order_id=order_id, amount=amount)
    except ValidationError as e:
        return f"ERROR (validation): {e.errors()[0]['msg']}"

    if order_id not in ORDERS:
        return f"ERROR (not found): order {order_id} does not exist"

    return f"Refunded ${amount:.2f} on {order_id}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[issue_refund],
    system_prompt="Use issue_refund with the exact order id and amount from the user.",
)

print("Case A — invalid INPUT (amount too high):")
print(
    agent.invoke({"messages": [HumanMessage(content="Refund $999 on order ORD-1.")]})[
        "messages"
    ][-1].content
)
print("-" * 100)

print("Case B — missing DATA (unknown order):")
print(
    agent.invoke({"messages": [HumanMessage(content="Refund $10 on order ORD-999.")]})[
        "messages"
    ][-1].content
)
print("-" * 100)
