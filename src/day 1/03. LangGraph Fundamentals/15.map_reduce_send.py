# 15 — Map-reduce with Send
#
# Concept: fan-out with Send (one worker per item), then a reduce node joins results.
# Annotated[..., add] merges worker updates; Send controls the parallel branches.
#
# Limitation overcome: a single-order ticket path cannot look up ORD-1, ORD-2, and
# ORD-3 in parallel when the customer asks about several orders at once.
#
# Example: look up ORD-1, ORD-2, ORD-3 in parallel, then one support summary.
#
# ```mermaid
# flowchart TD
#   START --> plan
#   plan -->|Send| work
#   work --> reduce
#   reduce --> END
# ```

from operator import add
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending", "ORD-3": "cancelled"}


class TicketState(TypedDict):
    order_ids: list[str]
    notes: Annotated[list[str], add]
    summary: str


def plan(state: TicketState) -> list[Send]:
    return [Send("work", {"order_id": oid}) for oid in state["order_ids"]]


def work(state: dict) -> dict:
    oid = state["order_id"]
    return {"notes": [f"{oid}={ORDERS.get(oid, 'missing')}"]}


def reduce(state: TicketState) -> dict:
    return {"summary": "; ".join(state["notes"])}


graph = StateGraph(TicketState)
graph.add_node("work", work)
graph.add_node("reduce", reduce)
graph.add_conditional_edges(START, plan, ["work"])
graph.add_edge("work", "reduce")
graph.add_edge("reduce", END)
app = graph.compile()


print(app.get_graph().draw_mermaid())
print("-" * 100)
print(app.invoke({"order_ids": ["ORD-1", "ORD-2", "ORD-3"], "notes": [], "summary": ""}))
print("-" * 100)
