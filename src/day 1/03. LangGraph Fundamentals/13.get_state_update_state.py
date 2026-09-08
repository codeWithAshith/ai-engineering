# 13 — get_state and update_state
#
# Concept: with a checkpointer you can inspect and edit a thread.
#   get_state(config)            — read latest checkpoint
#   update_state(config, values) — write a correction
#   invoke(None, config)         — resume / re-run from that point
#   get_state_history(config)    — list older checkpoints
#
# Limitation overcome: persistence alone cannot fix a ticket that ran with the
# wrong order id — a human must correct state and resume.
#
# Example: ticket ran with wrong order id ORD-1; human fixes to ORD-2 and resumes.
# Still limited: lookup logic is stuck inside one flat graph (hard to reuse).
#
# ```mermaid
# flowchart LR
#   invoke --> checkpoint
#   checkpoint --> get_state
#   get_state --> update_state
#   update_state --> resume[invoke None]
# ```

from typing import TypedDict

from langgraph.checkpoint.memory import MemorySaver
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
app = graph.compile(checkpointer=MemorySaver())

print(app.get_graph().draw_mermaid())
print("-" * 100)

config = {"configurable": {"thread_id": "ticket-1"}}

# Agent ran with the WRONG id
app.invoke({"order_id": "ORD-1", "status": "", "note": ""}, config=config)
print("1) get_state (wrong id used):", app.get_state(config).values)
print("   history checkpoints:", len(list(app.get_state_history(config))))
print("-" * 100)

# Human fixes the ticket, then re-run enrich from START
app.update_state(config, {"order_id": "ORD-2"}, as_node="__start__")
print("2) after update_state, next=", app.get_state(config).next)
print("   values=", app.get_state(config).values)
print("-" * 100)

print("3) resume:")
print(app.invoke(None, config=config))
print("-" * 100)
