# 05 — The model picks the tool
#
# One agent. This agent is reactive: no plan.
# It sees the question, calls one tool, sees the result, then answers.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def lookup_order_status(order_id: str) -> str:
    """Look up one order by id. Use for "where is my order?". Not for refunds."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def issue_refund(order_id: str, amount: float) -> str:
    """Refund a shipped order after the customer asked. Not for a status question."""
    return f"Refunded ${amount:.2f} on {order_id}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order_status, issue_refund],
    system_prompt="You are order support. Use the tool that matches the question.",
)

answer = agent.invoke({"messages": [HumanMessage(content="Where is ORD-1?")]})
for message in answer["messages"]:
    if message.type == "ai" and message.tool_calls:
        print("picked:", message.tool_calls[0]["name"])
print(answer["messages"][-1].content)
