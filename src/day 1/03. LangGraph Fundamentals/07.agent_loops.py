# 07 — Agent loops
#
# Concept: last lesson was one round — START → chatbot → tools → END.
# This lesson closes the back-edge:
#   chatbot ↔ ToolNode, tools_condition as the stop.
#
# create_agent is not a different idea. It compiles this graph.
# You add the nodes. tools_condition: tool_calls → tools, else END.
#
# Limitation overcome: ToolNode alone cannot look up, then answer from
# the result. The ticket needs a cycle until the model stops calling tools.
#
# Example: Status of ORD-1? chatbot plans lookup_order → tools run it →
# back to chatbot → no more tool_calls → END.

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langchain.tools import tool
from langgraph.graph import END, START, StateGraph
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

print("-" * 100)

result = app.invoke({"messages": [HumanMessage(content="What is the status of order ORD-1?")]})
for msg in result["messages"]:
    kind = type(msg).__name__
    if getattr(msg, "tool_calls", None):
        print(f"{kind}: tool_calls={msg.tool_calls}")
    else:
        print(f"{kind}: {msg.content}")
print("-" * 100)
print("lookup_order ran. Then chatbot answered. That back-edge is the loop.")
print("-" * 100)
