# 07 — Tool design patterns
#
# Concept: the model only sees tool names, docstrings, and parameter types.
# Good design = focused tools with clear docstrings that say WHEN to use them.
#
# What the model reads:
#   1. Function name (lookup_order → model knows this is about orders)
#   2. Docstring (tells model WHEN and WHY to call it)
#   3. Parameter names + types (order_id: str tells model what to pass)
    10|#   4. Pydantic Field descriptions (extra guidance on each arg)
#
# Evolution of Tool Design:
#   2022–2023 Q1: Giant do_everything() tools → model confused when to use
#   2023 Q2: Research showed focused tools (one action each) worked better
#   2023 Q3: Docstring guidelines emerged: include use-case examples
#   2024–Present: Standard pattern = verb_noun naming + when/why docstring + typed args
#   Takeaway: Models read docstrings like API docs. Write for the model, not humans.
#
# Example: order-support tools designed for clarity.
    20|
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool
from pydantic import BaseModel, Field

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}
    30|

# ────────────────────────────────────────────────────────────────────────────
# ❌ BAD: Vague, multi-purpose tool
# ────────────────────────────────────────────────────────────────────────────

@tool
def support_action(action: str, order_id: str, amount: float = None) -> str:
    """Handle support actions."""  # ← Too vague! When to use?
    if action == "lookup":
    40|        return ORDERS.get(order_id, "not found")
    elif action == "refund":
        return f"Refunded ${amount} on {order_id}"
    return "Unknown action"

# Problem: Model doesn't know WHEN to call this vs other tools


# ────────────────────────────────────────────────────────────────────────────
# ✅ GOOD: Focused tools with clear docstrings
    50|# ────────────────────────────────────────────────────────────────────────────

@tool
def lookup_order_status(order_id: str) -> str:
    """
    Fetch the current status of one order by ID.
    
    Use this when the customer asks:
    - "Where is my order?"
    - "What's the status of ORD-123?"
    60|    - "Has my order shipped?"
    
    Do NOT use for refunds or cancellations.
    """
    return ORDERS.get(order_id, f"Order {order_id} not found")


class RefundInput(BaseModel):
    order_id: str = Field(description="Order ID like ORD-1")
    amount: float = Field(gt=0, le=500, description="Refund amount in USD, max $500")
    70|

@tool(args_schema=RefundInput)
def issue_refund(order_id: str, amount: float) -> str:
    """
    Process a refund for a shipped order.
    
    Only call this after:
    1. Verifying order status with lookup_order_status()
    2. Customer explicitly requests a refund
    80|    3. Amount is between $0.01 and $500
    
    Use this when customer says:
    - "I want a refund for ORD-123"
    - "Can I get my money back?"
    
    Returns confirmation or error message.
    """
    if order_id not in ORDERS:
        return f"ERROR: Order {order_id} not found"
    90|    return f"Refunded ${amount:.2f} on {order_id} (was {ORDERS[order_id]})"


# ────────────────────────────────────────────────────────────────────────────
# Test: Good tools vs bad tool
# ────────────────────────────────────────────────────────────────────────────

print("❌ BAD TOOL (vague docstring):")
bad_agent = create_agent(
   100|    model="groq:openai/gpt-oss-20b",
    tools=[support_action],
    system_prompt="You are order support. Use tools when needed.",
)
result = bad_agent.invoke(
    {"messages": [HumanMessage(content="Where is ORD-1?")]},
    config={"recursion_limit": 10}
)
print("  Answer:", result["messages"][-1].content)
print("  Problem: Model might not know 'lookup' action exists")
   110|print("-" * 100)

print("✅ GOOD TOOLS (clear docstrings):")
good_agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order_status, issue_refund],
    system_prompt="You are order support. Use tools to answer accurately.",
)
result = good_agent.invoke(
    {"messages": [HumanMessage(content="Where is ORD-1?")]},
   120|    config={"recursion_limit": 10}
)
print("  Answer:", result["messages"][-1].content)
print("  ✓ Model knows exactly when to use lookup_order_status")
print("-" * 100)

print("TOOL DESIGN PATTERNS:")
print("  ✓ Naming: verb_noun (lookup_order, not get_data)")
print("  ✓ Docstring: Include when/why + example questions")
print("  ✓ Focused: One action per tool (not multi-purpose)")
   130|print("  ✓ Typed args: Pydantic Field descriptions for clarity")
print("  ✓ Preconditions: List steps to do BEFORE calling this tool")
print("-" * 100)
