# 03 — Order-support agent with tools
#
# Concept: bind lookup tools to a chatbot ↔ ToolNode loop so answers come from data.
#
# Limitation overcome: without tools the agent cannot see ORD-1 / ORD-2 status.
# Same ticket agent as before — now ORDERS is available via tools.
# Still limited: risky actions (refund) run with no human approval.
#
# Example: ORD-1 status and list all orders.
#
# ```mermaid
# flowchart TD
#   START --> chatbot
#   chatbot -->|tool_calls| tools
#   tools --> chatbot
#   chatbot -->|done| END
# ```

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from langchain.tools import tool
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

SYSTEM = SystemMessage(
    content="You are order support for ORD-* tickets. Use tools for live order data."
)


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def list_orders() -> str:
    """List all orders and statuses."""
    return ", ".join(f"{k}={v}" for k, v in ORDERS.items())


tools = [lookup_order, list_orders]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke([SYSTEM, *state["messages"]])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")
app = graph.compile()

print(app.get_graph().draw_mermaid())
print("-" * 100)
for q in ["Status of ORD-1?", "List all orders"]:
    r = app.invoke({"messages": [HumanMessage(content=q)]})
    print(f"Q: {q}\n  → {r['messages'][-1].content}\n")
print("-" * 100)
