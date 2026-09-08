# 07 — Streaming
#
# Concept: app.stream modes show progress differently.
#
# When to use what:
# | Mode       | Each event is                         | When to use                                      |
# |------------|---------------------------------------|--------------------------------------------------|
# | "updates"  | {node_name: partial update}           | Debug / progress: which node just wrote what     |
# | "values"   | full TicketState after that step      | UI that re-renders the whole ticket each step    |
# | "messages" | (token_chunk, meta) from the LLM      | Chat-style typing: show tokens as they arrive    |
# | invoke()   | one final state (not streaming)       | You only need the finished ticket reply          |
#
# How to show / see the difference (same inputs, three loops below):
#   1) updates  → print the dict
#                 look for {"chatbot": {"messages": [...]}}  — only the NEW bit
#   2) values   → print len(state["messages"])
#                 count grows 1 → 2 because full history is included each step
#   3) messages → print chunk content with end=""
#                 raw token strings appear piece by piece (not a state dict)
#
# Limitation overcome: invoke() hides the ticket reply until everything finishes.
# Support UIs need partial updates and tokens as they arrive.
#
# Example: order-support chatbot answering about ORD-1.
# Still limited: one stream mode at a time — chatbots need thinking (tool steps)
# and answer tokens together.
#
# ```mermaid
# flowchart LR
#   START --> chatbot
#   chatbot --> END
# ```

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
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
app = graph.compile()


print(app.get_graph().draw_mermaid())
print("-" * 100)
inputs = {
    "messages": [
        HumanMessage(content="One sentence: status style answer — ORD-1 shipped.")
    ]
}

# updates: only what the node returned (delta), keyed by node name
print("stream_mode='updates':  # → {'chatbot': {'messages': [...]}}")
for event in app.stream(inputs, stream_mode="updates"):
    print(event)
print("-" * 100)

# values: whole ticket after each step (history included)
print("stream_mode='values':  # → full state; watch msgs count grow")
for state in app.stream(inputs, stream_mode="values"):
    print("keys:", list(state.keys()), "msgs:", len(state["messages"]))
print("-" * 100)

# messages: LLM tokens live (not a state dict)
print("stream_mode='messages':  # → token text printed as it streams")
for chunk, _meta in app.stream(inputs, stream_mode="messages"):
    text = getattr(chunk, "content", None) or ""
    if text:
        print(text, end="", flush=True)
print()
print("-" * 100)
