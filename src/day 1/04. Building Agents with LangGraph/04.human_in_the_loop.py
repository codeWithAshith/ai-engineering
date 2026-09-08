# 04 — Order-support agent + human-in-the-loop
#
# Concept: same chatbot ↔ tools agent as 03, plus:
#   - MemorySaver (thread_id) so a pause can resume
#   - request_refund tool that calls interrupt() — human must approve
# Resume with Command(resume=True/False).
#
# Limitation overcome: lookup tools answer ORD-1, but refunds must not auto-run.
# Still limited: only interrupt-inside-tool; desk may need to approve
# any tool call at the boundary, or fix a wrong order id while paused.
#
# Example: status of ORD-1 (no pause) → refund ORD-1 (pause → approve).
#
# ```mermaid
# flowchart TD
#   START --> chatbot
#   chatbot -->|tool_calls| tools
#   tools -->|interrupt on refund| Human
#   Human -->|Command resume| tools
#   tools --> chatbot
#   chatbot -->|done| END
# ```

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
# NEW vs 03: checkpointer required for interrupt / resume
app = graph.compile(checkpointer=MemorySaver())

print(app.get_graph().draw_mermaid())
print("-" * 100)

# Same as 03 — lookup still works (no interrupt)
cfg_status = {"configurable": {"thread_id": "support-status"}}
r = app.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1?")]},
    config=cfg_status,
)
print("status (no pause):", r["messages"][-1].content)
print("-" * 100)

# NEW — refund tool hits interrupt(); resume with Command
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
