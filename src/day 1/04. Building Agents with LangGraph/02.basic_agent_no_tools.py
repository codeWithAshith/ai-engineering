# 02 — Order-support agent without tools
#
# Concept: a chat graph with no tools cannot see live order data —
# the model must guess or refuse.
#
# Limitation overcome: decide to build an order-support agent (vs a fixed workflow).
# Still limited: ORDERS exists in process memory but is not wired as a tool.
#
# Example: ask status of ORD-1 — agent has no lookup.
#
# ```mermaid
# flowchart LR
#   START --> chatbot
#   chatbot --> END
# ```

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}  # exists — agent cannot use it yet

SYSTEM = SystemMessage(
    content="You are order support for ORD-* tickets. You have NO live order DB. Be honest if unsure."
)


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


model = init_chat_model(model="groq:openai/gpt-oss-20b")


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke([SYSTEM, *state["messages"]])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_edge(START, "chatbot")
graph.add_edge("chatbot", END)
app = graph.compile()

print(app.get_graph().draw_mermaid())
print("-" * 100)
print("ORDERS in memory (unused):", ORDERS)
r = app.invoke({"messages": [HumanMessage(content="What is the status of ORD-1?")]})
print(r["messages"][-1].content)
print("-" * 100)
