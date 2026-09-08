# 05 — Approve tools before they run (interrupt_before)
#
# Use case: a support desk must approve sensitive actions before tools execute.
# Customer: "Cancel ORD-1." Agent plans cancel_order(ORD-1). Graph pauses.
# Human sees the pending tool call → approve → tool runs → agent replies.
#
# Concept: interrupt_before=["tools"] pauses at the tools node boundary
# (no special code inside the tool). Resume with invoke(None, config).
#
# Limitation overcome: interrupt() inside one tool (04) only covers that tool.
# Boundary pause reviews ANY tool call the model chose.
# Still limited: if the order id is wrong, the desk needs to edit state then resume.
#
# ```mermaid
# flowchart LR
#   chatbot -->|wants cancel_order| pause[interrupt_before tools]
#   pause -->|human OK| tools --> chatbot
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

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

SYSTEM = SystemMessage(
    content=(
        "You are order support. "
        "Use lookup_order for status. "
        "Use cancel_order when the customer asks to cancel."
    )
)


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def cancel_order(order_id: str) -> str:
    """Cancel an order (sensitive write)."""
    if order_id not in ORDERS:
        return f"Order {order_id} not found"
    ORDERS[order_id] = "cancelled"
    return f"Cancelled {order_id}"


tools = [lookup_order, cancel_order]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke([SYSTEM, *state["messages"]])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")

# Desk policy: nothing runs until a human approves the planned tool call
app = graph.compile(checkpointer=MemorySaver(), interrupt_before=["tools"])

print(app.get_graph().draw_mermaid())
print("-" * 100)

cfg = {"configurable": {"thread_id": "cancel-ORD-1"}}
app.invoke(
    {"messages": [HumanMessage(content="Please cancel order ORD-1.")]},
    config=cfg,
)

# What the human desk sees while paused
pending = app.get_state(cfg).values["messages"][-1]
print("DESK REVIEW — agent wants to run:")
print(" ", getattr(pending, "tool_calls", pending))
print(" next node:", app.get_state(cfg).next)
print("-" * 100)

# Human approves → tools run → final reply
done = app.invoke(None, config=cfg)
print("after approval:", done["messages"][-1].content)
print("ORDERS now:", ORDERS)
print("-" * 100)
