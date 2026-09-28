# 02 — Tool errors and validation (graceful failure handling)
#
# Concept: Tools should fail clearly, not crash the agent.
#   args_schema — Pydantic model on @tool so args are typed/described for the model
#   Bad INPUT  — validate and return an ERROR string (not exception)
#   Bad DATA   — missing order — return an ERROR string
# Returning an error keeps the agent running (no crash).
#
# Evolution of Tool Error Handling:
#   2022: Exceptions crash agents → lost conversation state, bad UX
#   2023 Q1: Try/except in every tool → boilerplate hell
#   2023 Q2: args_schema introduced → validate before execution
#   2024-Present: Return error strings → agent can retry or explain
#   Takeaway: Errors are tool outputs, not exceptions. Let agent handle them.
#
# Example: issue_refund on ORD-1 / ORD-999 with invalid amount or unknown id
#
# ```mermaid
# flowchart TD
#   user[Customer: refund $999 ORD-1] --> agent
#   agent -->|plan tool call| validate[Tool validation]
#   validate -->|args invalid| error1[ERROR: amount > 500]
#   validate -->|args valid| check[Check order exists]
#   check -->|not found| error2[ERROR: order not found]
#   check -->|found| success[Refund issued]
#   error1 --> agent
#   error2 --> agent
#   success --> agent
# ```

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool
from pydantic import BaseModel, Field, ValidationError

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

# KEY CODE SNIPPET: Pydantic schema for tool validation
class RefundInput(BaseModel):
    order_id: str = Field(min_length=1, description="Order id like ORD-1")
    amount: float = Field(gt=0, le=500, description="USD, max 500")

@tool(args_schema=RefundInput)
def issue_refund(order_id: str, amount: float) -> str:
    """Issue a refund. amount must be > 0 and <= 500. order must exist."""
    # Validate input (Pydantic catches this at tool call time, but double-check)
    try:
        RefundInput(order_id=order_id, amount=amount)
    except ValidationError as e:
        return f"ERROR (validation): {e.errors()[0]['msg']}"

    # Check data exists
    if order_id not in ORDERS:
        return f"ERROR (not found): order {order_id} does not exist"

    # Success case
    return f"Refunded ${amount:.2f} on {order_id}"

agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[issue_refund],
    system_prompt="Use issue_refund with the exact order id and amount from the user.",
)

# ════════════════════════════════════════════════════════════════════════════
# TEST CASE A: Invalid INPUT (amount exceeds limit)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("TEST CASE A: Invalid INPUT (amount too high)")
print("═" * 100)
print()

result_a = agent.invoke({"messages": [HumanMessage(content="Refund $999 on order ORD-1.")]})
result_b = agent.invoke({"messages": [HumanMessage(content="Refund $10 on order ORD-999.")]})
