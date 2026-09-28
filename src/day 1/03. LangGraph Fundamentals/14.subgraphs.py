# 14 — Subgraphs
#
# Concept: compile a small graph once and use it as a node inside a parent graph.
#
# Limitation overcome: stuffing normalize + lookup + note into one flat graph
# makes lookup hard to reuse across ticket flows.
#
# Example: same order-support ticket as nodes/edges (ORD-1 / ORD-2) —
#   parent: normalize → lookup (subgraph) → format_note
#   subgraph: fetch_status from ORDERS
# Still limited: one ticket at a time — multi-order questions run sequentially.
#
# ```mermaid
# flowchart TD
#   START --> normalize
#   normalize --> lookup
#   lookup --> format_note
#   format_note --> END
# ```

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


# --- reusable order-lookup subgraph (ticket fields: order_id, status) ---
class LookupState(TypedDict):
    order_id: str
    status: str


def fetch_status(state: LookupState) -> dict:
    return {"status": ORDERS.get(state["order_id"], "not found")}


lookup_builder = StateGraph(LookupState)
lookup_builder.add_node("fetch_status", fetch_status)
lookup_builder.add_edge(START, "fetch_status")
lookup_builder.add_edge("fetch_status", END)
lookup_sub = lookup_builder.compile()


# --- parent support-ticket graph ---
class TicketState(TypedDict):
    order_id: str
    status: str
    note: str


def normalize(state: TicketState) -> dict:
    return {"order_id": state["order_id"].strip().upper()}


def format_note(state: TicketState) -> dict:
    return {"note": f"{state['order_id']} is currently {state['status']}"}


parent = StateGraph(TicketState)
parent.add_node("normalize", normalize)
parent.add_node("lookup", lookup_sub)  # compiled subgraph as a node
parent.add_node("format_note", format_note)
parent.add_edge(START, "normalize")
parent.add_edge("normalize", "lookup")
parent.add_edge("lookup", "format_note")
parent.add_edge("format_note", END)
app = parent.compile()


print(app.get_graph().draw_mermaid())
print("-" * 100)
print("ORD-1:", app.invoke({"order_id": " ord-1 ", "status": "", "note": ""}))
print("ORD-2:", app.invoke({"order_id": "ord-2", "status": "", "note": ""}))
print("-" * 100)
