# 12 — Durable checkpointers
#
# Concept: SqliteSaver stores checkpoints on disk so a thread survives process restart
# (same compile(checkpointer=...) API as MemorySaver).
#
# Limitation overcome: MemorySaver only lives in RAM — restart the support process
# and the ticket thread (ORD-2) is gone.
#
# Example: order-support thread that recalls the active order id ORD-2.
# Still limited: you can persist state, but not inspect or correct a bad ticket mid-run.
#
# ```mermaid
# flowchart LR
#   START --> chatbot
#   chatbot --> END
#   db[(SQLite)] -.-> chatbot
# ```

from pathlib import Path
from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

load_dotenv()

DB = Path(__file__).parent / "_checkpoints.sqlite"


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


model = init_chat_model(model="groq:openai/gpt-oss-20b")


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke(state["messages"])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_edge(START, "chatbot")
graph.add_edge("chatbot", END)

thread = {"configurable": {"thread_id": "durable-1"}}

with SqliteSaver.from_conn_string(str(DB)) as checkpointer:
    app = graph.compile(checkpointer=checkpointer)
    print(app.get_graph().draw_mermaid())
    print("-" * 100)
    app.invoke(
        {
            "messages": [
                HumanMessage(
                    content="For this demo only, store that the active order id is ORD-2."
                )
            ]
        },
        config=thread,
    )
    r = app.invoke(
        {
            "messages": [
                HumanMessage(
                    content="Reply with only the active order id from earlier in this thread."
                )
            ]
        },
        config=thread,
    )
    print(r["messages"][-1].content)
    print("db file:", DB)
print("-" * 100)
