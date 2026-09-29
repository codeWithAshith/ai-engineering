# 11 — Persistence (short-term memory)
#
# InMemorySaver is the box. A checkpoint is one snapshot inside it.
# Same thread_id reads earlier turns. A new thread_id does not.
# The lesson is the second turn still knowing ORD-1.

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langgraph.checkpoint.memory import InMemorySaver
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
app = graph.compile(checkpointer=InMemorySaver())

thread = {"configurable": {"thread_id": "support-1"}}
app.invoke({"messages": [HumanMessage(content="My order id is ORD-1.")]}, config=thread)
same = app.invoke(
    {"messages": [HumanMessage(content="What order id did I mention?")]},
    config=thread,
)
print("same thread:", same["messages"][-1].content)
print("-" * 100)

other = app.invoke(
    {"messages": [HumanMessage(content="What order id did I mention?")]},
    config={"configurable": {"thread_id": "support-2"}},
)
print("new thread:", other["messages"][-1].content)
print("-" * 100)

snap = app.get_state(thread)
print("thread_id:    ", snap.config["configurable"]["thread_id"])
print("checkpoint_id:", snap.config["configurable"]["checkpoint_id"])
print("messages:     ", len(snap.values["messages"]))
print("-" * 100)
