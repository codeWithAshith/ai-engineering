# 02 — Human in the loop
#
# Lookup runs straight through.
# request_refund calls interrupt(). The run stops and the checkpoint stays.
# The same thread_id plus Command(resume=True) continues that tool.

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from langchain.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.types import Command, interrupt

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

SYSTEM = SystemMessage(
    content=(
        "You are order support for ORD-* tickets. "
        "Use lookup_order / list_orders for status. "
        "Use request_refund when the customer asks to refund — it needs human approval."
    )
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


@tool
def request_refund(order_id: str) -> str:
    """Request a refund for an order. Pauses for human approval."""
    if order_id not in ORDERS:
        return f"Order {order_id} not found"
    approved = interrupt({"please_approve": f"refund {order_id}", "order": order_id})
    if approved:
        return f"Refund approved for {order_id} (was {ORDERS[order_id]})"
    return f"Refund rejected for {order_id}"


tools = [lookup_order, list_orders, request_refund]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke([SYSTEM, *state["messages"]])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")
app = graph.compile(checkpointer=MemorySaver())

print("-" * 100)

cfg_status = {"configurable": {"thread_id": "support-status"}}
r = app.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1?")]},
    config=cfg_status,
)
print("status (no pause):", r["messages"][-1].content)
print("-" * 100)

cfg_refund = {"configurable": {"thread_id": "support-refund"}}
paused = app.invoke(
    {"messages": [HumanMessage(content="Please refund ORD-1.")]},
    config=cfg_refund,
)
print("paused:", paused.get("__interrupt__") or paused)
print("-" * 100)

done = app.invoke(Command(resume=True), config=cfg_refund)
print("resumed:", done["messages"][-1].content)
print("-" * 100)
