# 04 — API tools (wrapping HTTP calls)
#
# Concept: Wrap an HTTP call in @tool so the model only sees name + args,
# never URLs or headers. Agent calls your function, you handle HTTP details.
#
# Evolution of API Integration:
#   2022: Pass API URLs to agent → security risk, exposed credentials
#   2023 Q1: Manual HTTP in tools → boilerplate everywhere
#   2023 Q3: @tool + requests lib → clean abstraction
#   2024-Present: Tool returns parsed data, agent never sees raw HTTP
#   Takeaway: Agent should never see implementation details (URLs, tokens, headers).
#
# Example: Order support — lookup_order locally, fetch_tracking_note via HTTP
#
# ```mermaid
# flowchart TD
#   agent -->|call| local[lookup_order - local DB]
#   agent -->|call| api[fetch_tracking_note - HTTP API]
#   api -->|GET jsonplaceholder.typicode.com| external[External Service]
#   external --> api
#   local --> agent
#   api --> agent
# ```

import json
import urllib.request

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def lookup_order(order_id: str) -> str:
    """Local order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def fetch_tracking_note(note_id: int) -> str:
    """Fetch an external tracking note by id (demo API)."""
    try:
        req = urllib.request.Request(
            f"https://jsonplaceholder.typicode.com/posts/{note_id}",
            headers={"User-Agent": "order-support-agent/1.0"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return f"Tracking note {note_id}: {data.get('title', 'N/A')}"
    except Exception as e:
        return f"ERROR fetching tracking note: {e}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, fetch_tracking_note],
    system_prompt="You are order support. Use lookup_order for status, fetch_tracking_note for shipment details.",
)

print("═" * 100)
print("LOCAL TOOL (fast)")
print("═" * 100)
r1 = agent.invoke({"messages": [HumanMessage(content="Status of ORD-1?")]})
print(f"A: {r1['messages'][-1].content}")
print()
print("EXAMPLE OUTPUT: The status of ORD-1 is shipped.")
print("-" * 100)

print()
print("═" * 100)
print("API TOOL (HTTP call)")
print("═" * 100)
r2 = agent.invoke({"messages": [HumanMessage(content="Get tracking note 1.")]})
print(f"A: {r2['messages'][-1].content}")
print()
print("EXAMPLE OUTPUT: Tracking note 1 contains shipment details for your order.")
print()
print("KEY CONCEPTS:")
print("  • Agent calls fetch_tracking_note(1)")
print("  • Tool makes HTTP GET to external API")
print("  • Tool returns parsed data (not raw JSON)")
print("  • Agent never sees URL, headers, or auth tokens")
print("-" * 100)
