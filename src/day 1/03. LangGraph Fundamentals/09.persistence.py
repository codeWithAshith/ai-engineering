# 09 — Persistence and checkpoints (MemorySaver + thread_id + checkpoint_id)
#
# Concept:
#   Checkpoint   — snapshot of state after a step
#   Persistence  — those snapshots available on later invoke() calls
#   thread_id    — which conversation (required with checkpointer)
#   checkpoint_id — which exact snapshot in that thread (optional)
#
# MemorySaver keeps checkpoints in RAM keyed by thread_id.
#
# Config shapes:
    10|#   {"configurable": {"thread_id": "support-1"}}  
#     → latest checkpoint for that thread (normal multi-turn chat)
#   
#   {"configurable": {"thread_id": "support-1", "checkpoint_id": "<uuid>"}}
#     → pin one exact snapshot (time travel, debug, history inspection)
#
# When you actually need checkpoint_id:
# | Use                    | Why                                                      |
# |------------------------|----------------------------------------------------------|
# | Inspect history        | get_state / get_state_history — ticket at step N         |
    20|# | Time travel / replay   | Re-run from an older snapshot, not only "latest"         |
# | Human fix + resume     | Jump to a bad step, update_state, continue               |
# | Debug                  | Reproduce state when a tool / node failed                |
#
# Mental model:
#   thread_id     = which conversation (ORD-1 support chat)
#   checkpoint_id = which frame of that conversation (optional, for history/time-travel)
#
# Most chatbots never set checkpoint_id — only thread_id.
#
    30|# Limitation overcome: without a checkpointer, each ticket turn is isolated —
# the customer must repeat ORD-1 every message.
#
# Example: order-support chat with thread_id memory, then inspect checkpoint history.
# Still limited: MemorySaver dies when the process exits (use SqliteSaver for durability).
#
# ```mermaid
# flowchart LR
#   START --> chatbot
#   chatbot --> END
    40|#   cp[(checkpointer)] -.-> chatbot
# ```

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
    50|from langgraph.graph.message import add_messages

load_dotenv()


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


model = init_chat_model(model="groq:openai/gpt-oss-20b")
    60|

def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke(state["messages"])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_edge(START, "chatbot")
graph.add_edge("chatbot", END)
    70|app = graph.compile(checkpointer=MemorySaver())

print(app.get_graph().draw_mermaid())
print("-" * 100)

# --- Part 1: Basic multi-turn with thread_id ---
print("PART 1: thread_id basics (same thread remembers, new thread forgets)")
thread = {"configurable": {"thread_id": "support-1"}}
app.invoke({"messages": [HumanMessage(content="My order id is ORD-1.")]}, config=thread)
r2 = app.invoke(
    80|    {"messages": [HumanMessage(content="What order id did I mention?")]},
    config=thread,
)
print("same thread:", r2["messages"][-1].content)
print("-" * 100)

r3 = app.invoke(
    {"messages": [HumanMessage(content="What order id did I mention?")]},
    config={"configurable": {"thread_id": "support-2"}},
)
    90|print("new thread:", r3["messages"][-1].content)
print("-" * 100)

# --- Part 2: Inspect checkpoint_id and history ---
print("PART 2: checkpoint_id (optional — inspect history, time-travel, debug)")
# Add more turns to build history
app.invoke(
    {"messages": [HumanMessage(content="Please remember that id.")]},
    config=thread,
)
   100|app.invoke(
    {"messages": [HumanMessage(content="Also note: customer is VIP.")]},
    config=thread,
)

# get_state(thread) → latest snapshot; its config includes checkpoint_id
snap = app.get_state(thread)
print("thread_id:    ", snap.config["configurable"]["thread_id"])
print("checkpoint_id:", snap.config["configurable"]["checkpoint_id"])
print("messages:     ", len(snap.values["messages"]), "total")
   110|print("-" * 100)

# Optional: pin that exact snapshot (not required for normal multi-turn chat)
pinned = {
    "configurable": {
        "thread_id": snap.config["configurable"]["thread_id"],
        "checkpoint_id": snap.config["configurable"]["checkpoint_id"],
    }
}
print("pinned config (optional):", pinned)
   120|print("values at pin:", len(snap.values["messages"]), "messages")
print("-" * 100)

# Inspect full history (all checkpoints for this thread)
print("get_state_history → list all checkpoints:")
history = list(app.get_state_history(thread))
print(f"  {len(history)} checkpoints in thread 'support-1'")
for i, h in enumerate(history[:3]):  # show first 3
    print(f"  [{i}] checkpoint_id={h.config['configurable']['checkpoint_id'][:8]}... msgs={len(h.values['messages'])}")
   130|print("-" * 100)
print("tip: Full edit/resume from a checkpoint is in the get_state / update_state lesson.")
print("-" * 100)
