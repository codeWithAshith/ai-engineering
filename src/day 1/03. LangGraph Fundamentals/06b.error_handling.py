# 06b — Error handling in graphs
#
# Concept: nodes can fail (API down, bad data, exceptions).
#   Option 1: try/except inside the node → return error in state
#   Option 2: error routing node → conditional edge to retry/fallback
#
# Limitation overcome: unhandled exceptions crash the graph; production needs
# graceful degradation or retry logic.
#
    10|# Example: order-support lookup that might fail (API down) — retry once, then fallback.
#
# ```mermaid
# flowchart TD
#   START --> lookup
#   lookup -->|success| format
#   lookup -->|error + retries<1| lookup
#   lookup -->|error + retries>=1| fallback
#   format --> END
#   fallback --> END
# ```
    20|
import random
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class TicketState(TypedDict):
    30|    order_id: str
    status: str
    error: str
    answer: str
    retries: int


def lookup(state: TicketState) -> dict:
    """Lookup that might fail (simulate flaky API)."""
    40|    # Simulate 50% failure rate
    if random.random() < 0.5:
        return {
            "error": "API connection failed",
            "retries": state.get("retries", 0) + 1
        }
    
    status = ORDERS.get(state["order_id"], "not found")
    return {"status": status, "error": ""}

    50|
def route_after_lookup(state: TicketState) -> str:
    """Decide: success → format, error+can retry → lookup, else → fallback."""
    if not state.get("error"):
        return "format"
    
    if state.get("retries", 0) < 2:  # allow 1 retry
        return "lookup"
    
    return "fallback"
    60|

def format_answer(state: TicketState) -> dict:
    return {"answer": f"Order {state['order_id']} status: {state['status']}"}


def fallback_answer(state: TicketState) -> dict:
    return {
        "answer": f"Sorry, our system is temporarily unavailable. Please try again later. (Error: {state['error']})"
    }
    70|

graph = StateGraph(TicketState)
graph.add_node("lookup", lookup)
graph.add_node("format", format_answer)
graph.add_node("fallback", fallback_answer)
graph.add_edge(START, "lookup")
graph.add_conditional_edges(
    "lookup",
    route_after_lookup,
    80|    {"format": "format", "lookup": "lookup", "fallback": "fallback"}
)
graph.add_edge("format", END)
graph.add_edge("fallback", END)
app = graph.compile()

print(app.get_graph().draw_mermaid())
print("-" * 100)

# Run a few times to see both success and retry/fallback paths
    90|for i in range(3):
    result = app.invoke({
        "order_id": "ORD-1",
        "status": "",
        "error": "",
        "answer": "",
        "retries": 0
    })
    print(f"Run {i+1}: {result.get('answer', 'no answer')} (retries: {result.get('retries', 0)})")

print("-" * 100)
   100|
print("ERROR HANDLING PATTERNS:")
print("  try/except in node       → return error string in state (node doesn't crash)")
print("  conditional edge routing → check state.error and route to retry/fallback")
print("  retry limit in state     → prevent infinite retry loops")
print("-" * 100)

print("ALTERNATIVE: ToolErrorMiddleware (see Tool Calling section) wraps tool exceptions.")
print("-" * 100)
