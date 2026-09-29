# 14 — get_state and update_state
#
# The graph already finished. This is not interrupt().
# get_state reads the checkpoint. update_state writes the right order id.
# invoke(None) runs enrich again from that checkpoint.

from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class TicketState(TypedDict):
    order_id: str
    status: str
    note: str


def enrich(state: TicketState) -> dict:
    status = ORDERS.get(state["order_id"], "not found")
    return {"status": status, "note": f"Handling {state['order_id']} → {status}"}


graph = StateGraph(TicketState)
graph.add_node("enrich", enrich)
graph.add_edge(START, "enrich")
graph.add_edge("enrich", END)
app = graph.compile(checkpointer=InMemorySaver())

config = {"configurable": {"thread_id": "ticket-1"}}

app.invoke({"order_id": "ORD-1", "status": "", "note": ""}, config=config)
print("ran:", app.get_state(config).values["order_id"], app.get_state(config).values["status"])

app.update_state(config, {"order_id": "ORD-2"}, as_node="__start__")
print("edited:", app.get_state(config).values["order_id"], "next:", app.get_state(config).next)

done = app.invoke(None, config=config)
print("again:", done["order_id"], done["status"])
