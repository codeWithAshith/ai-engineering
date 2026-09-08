# 03 — Conditional edges
#
# Concept: add_conditional_edges(source, route_fn) — route_fn(state) returns
# the next node name. Branching logic lives in that edge function.
#
# Limitation overcome: fixed edges always run normalize → enrich for every
# ticket. High-priority tickets need the VIP desk; normal ones the standard desk.
#
# Example: ticket priority high → vip desk, else → standard desk (ORD-1 / ORD-2).
# Still limited: the choice is not stored in state (hard to log / reuse), and
# free-text questions have no ready-made priority field to branch on.
#
# ```mermaid
# flowchart TD
#   START --> classify
#   classify -->|priority high| vip
#   classify -->|else| standard
#   vip --> END
#   standard --> END
# ```

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class TicketState(TypedDict):
    order_id: str
    priority: str  # "high" | "normal"
    desk: str


def classify(state: TicketState) -> dict:
    # optional prep node; branching itself is the route() edge below
    return {}


def vip_desk(state: TicketState) -> dict:
    status = ORDERS.get(state["order_id"], "not found")
    return {"desk": f"VIP desk: {state['order_id']} → {status}"}


def standard_desk(state: TicketState) -> dict:
    status = ORDERS.get(state["order_id"], "not found")
    return {"desk": f"Standard desk: {state['order_id']} → {status}"}


def route(state: TicketState) -> str:
    """Conditional EDGE: decides next node (no intent field written)."""
    return "vip" if state["priority"] == "high" else "standard"


graph = StateGraph(TicketState)
graph.add_node("classify", classify)
graph.add_node("vip", vip_desk)
graph.add_node("standard", standard_desk)
graph.add_edge(START, "classify")
graph.add_conditional_edges("classify", route)
graph.add_edge("vip", END)
graph.add_edge("standard", END)
app = graph.compile()


print(app.get_graph().draw_mermaid())
print("-" * 100)
print("high:", app.invoke({"order_id": "ORD-1", "priority": "high", "desk": ""}))
print("normal:", app.invoke({"order_id": "ORD-2", "priority": "normal", "desk": ""}))
print("-" * 100)
