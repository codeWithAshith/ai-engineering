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
print(f"Request: Refund $999 on order ORD-1")
print(f"Agent response: {result_a['messages'][-1].content}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Request: Refund $999 on order ORD-1")
print("Agent response: I'm sorry, but I cannot process that refund. The amount $999 exceeds the maximum allowed refund of $500.")
print()
print("Behind the scenes:")
print("  1. Agent calls issue_refund(order_id='ORD-1', amount=999)")
print("  2. Validation fails: amount > 500")
print("  3. Tool returns: 'ERROR (validation): Input should be less than or equal to 500'")
print("  4. Agent sees error and explains to customer")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# TEST CASE B: Missing DATA (order doesn't exist)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("TEST CASE B: Missing DATA (order not found)")
print("═" * 100)
print()

result_b = agent.invoke({"messages": [HumanMessage(content="Refund $10 on order ORD-999.")]})
print(f"Request: Refund $10 on order ORD-999")
print(f"Agent response: {result_b['messages'][-1].content}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Request: Refund $10 on order ORD-999")
print("Agent response: I cannot find order ORD-999 in the system. Please verify the order ID and try again.")
print()
print("Behind the scenes:")
print("  1. Agent calls issue_refund(order_id='ORD-999', amount=10)")
print("  2. Validation passes (amount is valid)")
print("  3. Order lookup fails: ORD-999 not in ORDERS")
print("  4. Tool returns: 'ERROR (not found): order ORD-999 does not exist'")
print("  5. Agent sees error and asks customer to verify ID")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("TOOL ERROR PATTERNS:")
print()
print("1. INPUT VALIDATION (args_schema):")
print("   • Pydantic Field constraints (gt=0, le=500, min_length=1)")
print("   • Model sees schema → knows limits before calling")
print("   • Catches: wrong types, out-of-range values, missing required fields")
print()
print("2. DATA VALIDATION (business logic):")
print("   • Check if order exists in database")
print("   • Check if action is allowed (can't refund delivered order)")
print("   • Return descriptive error string")
print()
print("3. ERROR AS OUTPUT (not exception):")
print("   • ✓ return 'ERROR: reason' → agent can retry or explain")
print("   • ✗ raise Exception → crashes agent, loses conversation")
print()
print("BENEFITS:")
print("  ✓ Agent stays running (graceful degradation)")
print("  ✓ Customer gets helpful explanation (not 500 error)")
print("  ✓ Agent can try alternate tool or ask for clarification")
print()
print("PRODUCTION PATTERN:")
print("  @tool(args_schema=YourSchema)")
print("  def your_tool(args) -> str:")
print("      # 1. Validate business rules")
print("      if not valid:")
print("          return 'ERROR: clear reason'")
print("      # 2. Execute action")
print("      return 'Success: what happened'")
print()
print("NEXT LESSON:")
print("  03. read_vs_write_tools.py → Separate read/write tool permissions")
print("-" * 100)
