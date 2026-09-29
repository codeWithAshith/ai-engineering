# 10 — Thinking then answer (dual stream)
#
# Concept: combine stream modes on an agent loop.
#   stream_mode=["updates", "messages"]
#   updates  → "thinking" UI (which node ran: chatbot / tools)
#   messages → typed final answer tokens
#
# Limitation overcome: streaming one mode alone cannot show both tool progress
# and live answer text. Real chatbots need both at once.
#
# Example:
#   Way 1 — graph steps: stream_mode=["updates", "messages"]
#           updates prints [step] chatbot / tools. These are node names, not thoughts.
#           messages types the reply
#   Way 2 — a smaller model only mimics a thought. It does not look up ORD-1
#           and it does not write the customer reply. Way 1 still does that.
# Still limited: each run starts fresh — no memory of the ticket thread.

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

print("WAY 1: stream_mode=['updates', 'messages']  — node names, then reply. Not the model's thoughts.")
# Tokens for a node can arrive before that node's updates event.
# Print the step label first, then only that node's text.
current = None

def step(node: str) -> None:
    global current
    if node != current:
        if current is not None:
            print()
        print(f"[step] {node}")
        current = node

for mode, event in app.stream(
    ticket,
    stream_mode=["updates", "messages"],
    config={"recursion_limit": 10},
):
    if mode == "updates":
        step(next(iter(event)))
    elif mode == "messages":
        chunk, meta = event
        node = (meta or {}).get("langgraph_node") or current
        if node:
            step(node)
        text = getattr(chunk, "content", None) or ""
        if text:
            print(text, end="", flush=True)

print()
print("-" * 100)

# Way 2: a smaller model mimics the thought. One job: say what it would do.
# It has no tools, so it must not invent "shipped".
print("WAY 2: a separate call mimics a thought — not a node name, not the order status")
think = init_chat_model(model="groq:openai/gpt-oss-20b")
print("[thinking] ", end="", flush=True)
for chunk in think.stream([
    HumanMessage(
        content=(
            "Customer asked: What is the status of order ORD-1? "
            "Write one short thought about the next action. "
            "Do not answer the customer. Do not invent the status."
        )
    )
]):
    text = getattr(chunk, "content", None) or ""
    if text:
        print(text, end="", flush=True)
print()
print("-" * 100)
