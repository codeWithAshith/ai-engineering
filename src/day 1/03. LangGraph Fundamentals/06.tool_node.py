# 06 — ToolNode
#
# Concept: ToolNode is a prebuilt node that runs tool_calls from the last
# AI message. It is the executor you wrote by hand in Tool Calling.
#
#   bind_tools — the model returns name + args. It does not run Python.
#   You then: lookup_order.invoke(...) and build a ToolMessage.
#   ToolNode — that same work as a graph node:
#     add_node("tools", ToolNode(tools))
#
# create_agent uses this node. It is not a different idea.
#
# Limitation overcome: stuffing lookup into chatbot, or rewriting ToolMessage
# glue on every ticket, hides the desk that actually runs the tools.
#
# Example: START → chatbot → tools → END for ORD-1. One round, no loop.
# Still limited: the model cannot call tools again. That back-edge is
#   chatbot ↔ ToolNode with tools_condition as the stop — agent loops.
#
# | Metric              | Tool node pattern                         | Agent loop pattern                              |
# |---------------------|-------------------------------------------|-------------------------------------------------|
# | Control flow        | Deterministic — graph dictates the hop    | Dynamic — LLM picks if / when / which tools     |
# | LLM responsibility  | Low — writes args; the graph executes     | High — reason, inspect, decide to stop          |
# | State mutation      | Linear — sequential attribute updates     | Cyclic — append tool logs to message history    |
# | Best used for       | Structured workflows (extract, then query)| Open-ended work (research, then summarize)      |

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langchain.tools import tool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

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
graph.add_edge("chatbot", "tools")
graph.add_edge("tools", END)
app = graph.compile()

print("-" * 100)

result = app.invoke({"messages": [HumanMessage(content="What is the status of ORD-1?")]})
for msg in result["messages"]:
    kind = type(msg).__name__
    if getattr(msg, "tool_calls", None):
        print(f"{kind}: tool_calls={msg.tool_calls}")
    else:
        print(f"{kind}: {msg.content}")
print("-" * 100)
print("ToolNode ran lookup_order. There is no edge back to chatbot — that is the next lesson.")
print("-" * 100)
