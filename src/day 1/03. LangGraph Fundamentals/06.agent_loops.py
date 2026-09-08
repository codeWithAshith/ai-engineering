# 06 — Agent loops
#
# Concept: chatbot ↔ ToolNode until the model stops calling tools.
# tools_condition routes to tools or END. recursion_limit caps steps.
#
# Limitation overcome: a scripted normalize → enrich path cannot let the model
# decide when to look up ORD-1 / ORD-2. The ticket needs a cycle: model ↔ tools.
#
# Example: order-support graph looking up ORD-1.
# Still limited: you only see the final answer after invoke finishes.
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
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


tools = [lookup_order]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke(state["messages"])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")
app = graph.compile()


print(app.get_graph().draw_mermaid())
print("-" * 100)
# recursion_limit caps graph steps (model↔tools cycles count)
result = app.invoke(
    {"messages": [HumanMessage(content="What is the status of order ORD-1?")]},
    config={"recursion_limit": 10},
)
print(result["messages"][-1].content)
print("recursion_limit=10 set on invoke config (raise GraphRecursionError if exceeded)")
print("-" * 100)
