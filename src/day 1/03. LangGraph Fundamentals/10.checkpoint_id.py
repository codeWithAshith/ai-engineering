# 10 — Optional checkpoint_id
#
# Concept: thread_id selects the conversation; checkpoint_id (optional) selects
# one snapshot inside that conversation.
#   omit checkpoint_id → use the latest checkpoint for the thread (normal chat)
#   set checkpoint_id  → pin / inspect / resume from that exact snapshot
#
# Example shapes:
#   {"configurable": {"thread_id": "support-1"}}
#   {"configurable": {"thread_id": "support-1", "checkpoint_id": "<from get_state>"}}
#
# When you actually need checkpoint_id:
# | Use                    | Why                                                      |
# |------------------------|----------------------------------------------------------|
# | Inspect history        | get_state / get_state_history — ticket at step N         |
# | Time travel / replay   | Re-run from an older snapshot, not only "latest"         |
# | Human fix + resume     | Jump to a bad step, update_state, continue               |
# | Debug                  | Reproduce state when a tool / node failed                |
#
# Mental model:
#   thread_id     = which conversation (ORD-1 support chat)
#   checkpoint_id = which frame of that conversation (optional)
# Most chatbots never set checkpoint_id on every message.
#
# Limitation overcome: thread_id alone always continues from the latest state.
# Pinning a checkpoint_id lets you name one past ticket snapshot.
#
# Example: after ORD-1 turns, read checkpoint_id from get_state and build a pinned config.
# Still limited: invoke also needs recursion_limit / metadata for real tickets;
# and MemorySaver dies when the process exits.
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

thread = {"configurable": {"thread_id": "support-1"}}
app.invoke({"messages": [HumanMessage(content="My order id is ORD-1.")]}, config=thread)
app.invoke(
    {"messages": [HumanMessage(content="Please remember that id.")]},
    config=thread,
)

# get_state(thread) → latest snapshot; its config includes checkpoint_id
snap = app.get_state(thread)
print("thread_id:    ", snap.config["configurable"]["thread_id"])
print("checkpoint_id:", snap.config["configurable"]["checkpoint_id"])
print("messages:     ", len(snap.values["messages"]))
print("-" * 100)

# Optional: pin that exact snapshot (not required for normal multi-turn chat)
pinned = {
    "configurable": {
        "thread_id": snap.config["configurable"]["thread_id"],
        "checkpoint_id": snap.config["configurable"]["checkpoint_id"],
    }
}
print("pinned config (optional):", pinned)
print("values at pin:", [m.content for m in snap.values["messages"]])
print("-" * 100)
# Full edit/resume from a checkpoint is in the get_state / update_state lesson.
