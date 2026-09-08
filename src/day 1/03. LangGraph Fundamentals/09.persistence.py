# 09 — Checkpointing basics (MemorySaver + thread_id)
#
# Concept:
#   Checkpoint — snapshot of state after a step
#   Persistence — those snapshots available on later invoke() calls
# MemorySaver keeps checkpoints in RAM keyed by thread_id.
#
# Config (required with a checkpointer):
#   {"configurable": {"thread_id": "support-1"}}
# Same thread_id → shared memory; new thread_id → fresh ticket.
# checkpoint_id is optional — covered in the next lesson.
#
# Limitation overcome: without a checkpointer, each ticket turn is isolated —
# the customer must repeat ORD-1 every message.
#
# Example: order-support chat remembers ORD-1 on the same thread, not on a new one.
# Still limited: sometimes you need one exact snapshot inside a thread (checkpoint_id).
#
# ```mermaid
# flowchart LR
#   START --> chatbot
#   chatbot --> END
#   cp[(checkpointer)] -.-> chatbot
# ```

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

load_dotenv()


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


model = init_chat_model(model="groq:openai/gpt-oss-20b")


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke(state["messages"])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_edge(START, "chatbot")
graph.add_edge("chatbot", END)
app = graph.compile(checkpointer=MemorySaver())

print(app.get_graph().draw_mermaid())
print("-" * 100)

# thread_id alone is enough for normal multi-turn tickets
thread = {"configurable": {"thread_id": "support-1"}}
app.invoke({"messages": [HumanMessage(content="My order id is ORD-1.")]}, config=thread)
r2 = app.invoke(
    {"messages": [HumanMessage(content="What order id did I mention?")]},
    config=thread,
)
print("same thread:", r2["messages"][-1].content)
print("-" * 100)

r3 = app.invoke(
    {"messages": [HumanMessage(content="What order id did I mention?")]},
    config={"configurable": {"thread_id": "support-2"}},
)
print("new thread:", r3["messages"][-1].content)
print("-" * 100)
