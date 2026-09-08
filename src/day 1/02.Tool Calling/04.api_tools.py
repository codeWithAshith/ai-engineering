# 04 — API tools
#
# Concept: wrap an HTTP call in @tool so the model only sees name + args,
# never URLs or headers.
#
# Example: order support — lookup_order locally, fetch_tracking_note via HTTP.

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
    url = f"https://jsonplaceholder.typicode.com/posts/{note_id}"
    with urllib.request.urlopen(url, timeout=10) as response:
        data = json.loads(response.read().decode())
    return f"title={data['title']}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, fetch_tracking_note],
    system_prompt=(
        "Order support. Use lookup_order for local status. "
        "Use fetch_tracking_note for external notes by id."
    ),
)

result = agent.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1 and title of tracking note 1.")]}
)
print(result["messages"][-1].content)
print("-" * 100)
