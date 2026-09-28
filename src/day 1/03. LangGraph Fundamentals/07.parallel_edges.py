# 07 — Parallel fixed edges
#
# Concept: multiple edges from START or from one node run nodes in parallel.
#   Linear:   START → A → B → END
#   Parallel: START → A and B (both run), then merge → C → END
#
# Differs from map-reduce (Send): here edges are fixed; Send is dynamic per item.
#
# Limitation overcome: some workflows need two independent checks that can run
    10|# at the same time (e.g., validate order + check inventory).
#
# Example: order-support ticket — normalize order AND check customer tier in parallel,
# then merge results.
#
# ```mermaid
# flowchart TD
#   START --> normalize
#   START --> check_tier
#   normalize --> merge
#   check_tier --> merge
    20|#   merge --> END
# ```

from operator import add
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}
TIERS = {"ORD-1": "VIP", "ORD-2": "standard"}
    30|

class TicketState(TypedDict):
    order_id: str
    normalized_id: str
    tier: str
    notes: Annotated[list[str], add]  # accumulate notes from parallel branches
    answer: str


def normalize(state: TicketState) -> dict:
    40|    """Branch 1: normalize order id."""
    oid = state["order_id"].strip().upper()
    return {
        "normalized_id": oid,
        "notes": [f"Normalized: {state['order_id']} → {oid}"]
    }


def check_tier(state: TicketState) -> dict:
    """Branch 2: look up customer tier in parallel."""
    50|    # Uses original order_id (branches don't see each other until merge)
    raw_oid = state["order_id"].strip().upper()
    tier = TIERS.get(raw_oid, "standard")
    return {
        "tier": tier,
        "notes": [f"Customer tier: {tier}"]
    }


def merge(state: TicketState) -> dict:
    60|    """Merge: both branches done; final answer uses normalized_id + tier."""
    status = ORDERS.get(state["normalized_id"], "not found")
    prefix = "🌟 VIP" if state["tier"] == "VIP" else "Standard"
    return {
        "answer": f"{prefix} | Order {state['normalized_id']} → {status}",
        "notes": ["Merged parallel results"]
    }


    70|graph = StateGraph(TicketState)
graph.add_node("normalize", normalize)
graph.add_node("check_tier", check_tier)
graph.add_node("merge", merge)

# KEY: Two edges from START → both nodes run in parallel
graph.add_edge(START, "normalize")
graph.add_edge(START, "check_tier")

# Both must finish before merge
    80|graph.add_edge("normalize", "merge")
graph.add_edge("check_tier", "merge")
graph.add_edge("merge", END)

app = graph.compile()

print(app.get_graph().draw_mermaid())
print("-" * 100)

result = app.invoke({
    "order_id": " ord-1 ",
    90|    "normalized_id": "",
    "tier": "",
    "notes": [],
    "answer": ""
})

print("Answer:", result["answer"])
print("Notes (parallel + merge):", result["notes"])
print("-" * 100)

print("PARALLEL PATTERNS:")
   100|print("  Fixed parallel edges → START → A and B (both run, then merge)")
print("  Send (map-reduce)    → dynamic: one worker per item in a list")
print("")
print("Use fixed parallel when:")
print("  - Two independent checks (validation + lookup)")
print("  - Both must complete before continuing")
print("  - NOT looping over a list of items")
print("-" * 100)
