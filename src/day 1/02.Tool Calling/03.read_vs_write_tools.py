# 03 — Read vs write tools (tool risk classification)
#
# Concept: Label tools by risk / side effects for better safety.
#   READ  — lookup_order (no side effects; safe to retry)
#   WRITE — update_order_status (changes store state; needs confirmation)
#
# Evolution of Tool Safety:
#   2022: No distinction → agents accidentally made destructive changes
#   2023 Q1: Manual checks → fragile, error-prone
#   2023 Q3: READ/WRITE labels in docstrings → agent-aware classification
#   2024-Present: Governance layers enforce write permissions (Day 2 Section 04)
#   Takeaway: Always mark write tools clearly so agents treat them carefully.
#
# Example: Check ORD-2 status (safe READ), then update to shipped (risky WRITE)
#
# ```mermaid
# flowchart LR
#   user[User: status of ORD-2?] --> agent
#   agent -->|safe| read[READ: lookup_order]
#   read --> agent
#   user2[User: set ORD-2 shipped] --> agent
#   agent -->|risky| write[WRITE: update_order_status]
#   write -->|changes DB| agent
# ```

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
    return f"Updated {order_id} to {status}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, update_order_status],
    system_prompt="You are order support. Use READ tools freely. For WRITE tools, confirm with user first.",
)

print("═" * 100)
print("READ TOOL (safe, no confirmation needed)")
print("═" * 100)
r1 = agent.invoke({"messages": [HumanMessage(content="What is the status of ORD-2?")]})
print(f"Q: What is the status of ORD-2?")
print(f"A: {r1['messages'][-1].content}")
print()
print("EXAMPLE OUTPUT:")
print("A: The status of ORD-2 is pending.")
print("-" * 100)

print()
print("═" * 100)
print("WRITE TOOL (risky, should confirm)")
print("═" * 100)
r2 = agent.invoke({"messages": [HumanMessage(content="Set ORD-2 to shipped.")]})
print(f"Q: Set ORD-2 to shipped.")
print(f"A: {r2['messages'][-1].content}")
print()
print("EXAMPLE OUTPUT:")
print("A: I've updated order ORD-2 to shipped status.")
print()
print("KEY CONCEPTS:")
print("  READ tools: Safe, idempotent, no confirmation")
print("  WRITE tools: Risky, mutate state, should confirm")
print("  Mark in docstring so agent knows the difference")
print("-" * 100)
