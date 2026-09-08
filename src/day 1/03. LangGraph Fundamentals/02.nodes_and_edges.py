# 02 — Nodes and edges
#
# Concept:
#   Node  — function(state) → partial update dict
#   Fixed edge — always A→B (add_edge)
#   START / END — entry and exit
#
# Limitation overcome: without a graph you only have a script; here the ticket
# is real shared state that nodes update step by step.
#
# Example: linear ticket path normalize → enrich for ORD-1.
# Still limited: every ticket takes the same path (no VIP vs standard desk).
#
# ```mermaid
# flowchart LR
#   START --> normalize
#   normalize --> enrich
#   enrich --> END
# ```

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class TicketState(TypedDict):
    order_id: str
    status: str
    note: str


def normalize(state: TicketState) -> dict:
    return {"order_id": state["order_id"].strip().upper()}


def enrich(state: TicketState) -> dict:
    status = ORDERS.get(state["order_id"], "not found")
    return {"status": status, "note": f"{state['order_id']} is currently {status}"}


builder = StateGraph(TicketState)
builder.add_node("normalize", normalize)
builder.add_node("enrich", enrich)
builder.add_edge(START, "normalize")  # fixed
builder.add_edge("normalize", "enrich")  # fixed
builder.add_edge("enrich", END)

app = builder.compile()

print(app.get_graph().draw_mermaid())
print("-" * 100)
print(app.invoke({"order_id": " ord-1 ", "status": "", "note": ""}))
print("-" * 100)
