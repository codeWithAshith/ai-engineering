# 08 — Thinking then answer (dual stream)
#
# Concept: combine stream modes on an agent loop.
#   stream_mode=["updates", "messages"]
#   updates  → "thinking" UI (which node ran: chatbot / tools)
#   messages → typed final answer tokens
#
# Limitation overcome: streaming one mode alone cannot show both tool progress
# and live answer text. Real chatbots need both at once.
#
# Example: same ORD-1 + lookup_order agent loop; print [thinking] then answer.
# Still limited: each run starts fresh — no memory of the ticket thread.
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
ticket = {
    "messages": [HumanMessage(content="What is the status of order ORD-1?")]
}

# Dual stream: when stream_mode is a list, each event is (mode, data)
for mode, event in app.stream(
    ticket,
    stream_mode=["updates", "messages"],
    config={"recursion_limit": 10},
):
    if mode == "updates":
        node = next(iter(event))
        print(f"\n[thinking] step={node}")
    elif mode == "messages":
        chunk, _meta = event
        text = getattr(chunk, "content", None) or ""
        if text:
            print(text, end="", flush=True)

print()
print("-" * 100)
