# 11 — RunnableConfig extras (recursion_limit, metadata)
#
# Concept: invoke/stream take a config dict. Besides configurable.thread_id,
# common top-level keys are:
#   recursion_limit — max graph steps before GraphRecursionError (default ~25)
#   metadata        — free-form dict for this run (logging, tracing, node reads)
#
# Example shapes:
#   {"recursion_limit": 10, "metadata": {"desk": "vip", "order_hint": "ORD-1"}}
#   {"configurable": {"thread_id": "support-1"}, "recursion_limit": 10,
#    "metadata": {"desk": "vip"}}
#
# Limitation overcome: persistence alone does not cap loops or attach request
# context; tickets often need both a step budget and run metadata.
#
# Example: order-support node reads metadata; agent loop uses a low recursion_limit.
# Still limited: MemorySaver dies when the process exits.
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
from langchain.messages import HumanMessage
from langchain.tools import tool
from langchain_core.runnables import RunnableConfig
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]
    desk: str


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


tools = [lookup_order]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState, config: RunnableConfig) -> dict:
    # metadata is on the config for this invoke — not part of TicketState
    meta = config.get("metadata") or {}
    desk = meta.get("desk", state.get("desk") or "standard")
    print("metadata on this run:", meta, "→ desk:", desk)
    return {
        "desk": desk,
        "messages": [model.invoke(state["messages"])],
    }


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")
app = graph.compile()


print(app.get_graph().draw_mermaid())
print("-" * 100)

# recursion_limit caps chatbot↔tools steps; metadata rides along for the run
config = {
    "recursion_limit": 10,
    "metadata": {"desk": "vip", "order_hint": "ORD-1"},
}
result = app.invoke(
    {
        "messages": [HumanMessage(content="What is the status of order ORD-1?")],
        "desk": "",
    },
    config=config,
)
print("desk stored from metadata:", result["desk"])
print("answer:", result["messages"][-1].content)
print("-" * 100)
print("tip: raise GraphRecursionError if the loop exceeds recursion_limit")
print("-" * 100)
