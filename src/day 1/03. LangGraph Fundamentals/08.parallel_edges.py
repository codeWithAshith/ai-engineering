# 08 — Parallel fixed edges
#
# Concept: multiple edges from START or from one node run nodes in parallel.
#   Linear:   START → A → B → END
#   Parallel: START → A and B (both run), then merge → C → END
#
# KEY: two add_edge from START. Both branches must finish before merge.
# Merge waits. The fast branch does not start merge early. The slow one
# does not get skipped. Both have an edge into merge — that is a join:
# merge runs once, after both have finished.
# Branches do not see each other's writes until merge.
#
# Limitation overcome: some workflows need two independent checks at the same
# time (validate order + check inventory). Not for looping over a list of ids.
#
# Example: order-support ticket — normalize order AND check customer tier
# in parallel, then merge results. notes accumulate with Annotated[list, add].

from operator import add
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}
TIERS = {"ORD-1": "VIP", "ORD-2": "standard"}


class TicketState(TypedDict):
    order_id: str
    normalized_id: str
    tier: str
    notes: Annotated[list[str], add]  # accumulate notes from parallel branches
    answer: str


def normalize(state: TicketState) -> dict:
    """Branch 1: normalize order id."""
    oid = state["order_id"].strip().upper()
    return {
        "normalized_id": oid,
        "notes": [f"Normalized: {state['order_id']} → {oid}"]
    }


def check_tier(state: TicketState) -> dict:
    """Branch 2: look up customer tier in parallel."""
    # Uses original order_id (branches don't see each other until merge)
    raw_oid = state["order_id"].strip().upper()
    tier = TIERS.get(raw_oid, "standard")
    return {
        "tier": tier,
        "notes": [f"Customer tier: {tier}"]
    }


def merge(state: TicketState) -> dict:
    """Merge: both branches done; final answer uses normalized_id + tier."""
    status = ORDERS.get(state["normalized_id"], "not found")
    prefix = "🌟 VIP" if state["tier"] == "VIP" else "Standard"
    return {
        "answer": f"{prefix} | Order {state['normalized_id']} → {status}",
        "notes": ["Merged parallel results"]
    }


graph = StateGraph(TicketState)
graph.add_node("normalize", normalize)
graph.add_node("check_tier", check_tier)
graph.add_node("merge", merge)

# KEY: Two edges from START → both nodes run in parallel
graph.add_edge(START, "normalize")
graph.add_edge(START, "check_tier")

# Both must finish before merge
graph.add_edge("normalize", "merge")
graph.add_edge("check_tier", "merge")
graph.add_edge("merge", END)

app = graph.compile()

print("-" * 100)

result = app.invoke({
    "order_id": " ord-1 ",
    "normalized_id": "",
    "tier": "",
    "notes": [],
    "answer": ""
})

print("Answer:", result["answer"])
print("Notes (parallel + merge):", result["notes"])
print("-" * 100)

print("PARALLEL PATTERNS:")
print("  Fixed parallel edges → START → A and B (both run, then merge)")
print("")
print("Use fixed parallel when:")
print("  - Two independent checks (validation + lookup)")
print("  - Both must complete before continuing")
print("  - NOT looping over a list of items")
print("-" * 100)
