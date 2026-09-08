# 06 — Fix wrong order id while paused, then resume
#
# Use case: customer said "refund ORD-1" but meant ORD-2.
# Same agent as 05 (interrupt_before tools). Desk sees pending tool call,
# edits order_id with update_state, then resumes.
#
# Concept: update_state(config, values) while paused → invoke(None) to continue.
#
# Limitation overcome: approve/reject alone cannot correct a wrong id.
#
# ```mermaid
# flowchart LR
#   chatbot --> pause[interrupt_before]
#   pause --> edit[update_state ORD-1 to ORD-2]
#   edit --> tools --> chatbot
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
        "Use request_refund when asked to refund."
    )
)


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def request_refund(order_id: str) -> str:
    """File a refund for an order."""
    if order_id not in ORDERS:
        return f"Order {order_id} not found"
    return f"Refund filed for {order_id} (was {ORDERS[order_id]})"


tools = [lookup_order, request_refund]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke([SYSTEM, *state["messages"]])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")
app = graph.compile(checkpointer=MemorySaver(), interrupt_before=["tools"])

print(app.get_graph().draw_mermaid())
print("-" * 100)

cfg = {"configurable": {"thread_id": "refund-fix"}}
app.invoke(
    {"messages": [HumanMessage(content="Please refund ORD-1.")]},
    config=cfg,
)

last = app.get_state(cfg).values["messages"][-1]
print("paused — planned tool call:", getattr(last, "tool_calls", None))

# Desk: customer meant ORD-2 — rewrite the pending tool args
if getattr(last, "tool_calls", None):
    fixed = last.model_copy(deep=True)
    for tc in fixed.tool_calls:
        tc["args"] = {**tc.get("args", {}), "order_id": "ORD-2"}
    app.update_state(cfg, {"messages": [fixed]})
    print("edited tool call:", app.get_state(cfg).values["messages"][-1].tool_calls)

print("resume →", app.invoke(None, config=cfg)["messages"][-1].content)
print("-" * 100)
