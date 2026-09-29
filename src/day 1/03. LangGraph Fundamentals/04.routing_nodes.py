# 04 — Routing nodes
#
# Concept: a routing NODE writes a decision into state (e.g. intent),
# then a thin conditional edge only reads that field.
# Use when the decision should be stored, logged, or reused.
#
# | Metric                 | Pure conditional edge              | Routing node + thin edge             |
# |------------------------|------------------------------------|--------------------------------------|
# | Where logic lives      | Inside route() on the edge         | Inside a worker node (classify)      |
# | State footprint        | Read only — no update              | Writes intent onto state             |
# | Auditability           | Decision disappears after the hop  | Choice stays in state history        |
# | Downstream reuse       | Later nodes cannot see why         | Later nodes read state["intent"]     |
# | Edge complexity        | Thick — business / LLM logic       | Thin — return state["intent"]        |
#
# Limitation overcome: priority must already be on the ticket, and the desk
# choice never lands in state. Free-text support questions need intent computed
# and stored, then a thin edge that only reads it.
#
# Example: order-support question → order / product / other desk (ORD-1).
# Still limited: plain fields overwrite — if several nodes each set events=[],
# only the last node's list survives.

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

class TicketState(TypedDict):
    question: str
    intent: str  # written by the routing NODE
    answer: str

def classify(state: TicketState) -> dict:
    """Routing NODE: compute intent and store it in state."""
    q = state["question"].lower()
    if "ord-" in q or "order" in q:
        intent = "order"
    elif "stock" in q or "product" in q or "mouse" in q:
        intent = "product"
    else:
        intent = "other"
    return {"intent": intent}

def order_desk(state: TicketState) -> dict:
    for oid, status in ORDERS.items():
        if oid.lower() in state["question"].lower():
            return {"answer": f"Order desk: {oid} → {status}"}
    return {"answer": "Order desk: tell me an id like ORD-1"}

def product_desk(state: TicketState) -> dict:
    return {"answer": "Product desk: check catalog stock."}

def chitchat(state: TicketState) -> dict:
    return {"answer": "Happy to help with orders or products."}

def pick(state: TicketState) -> str:
    """Conditional EDGE: only reads what the routing node wrote."""
    return state["intent"]

graph = StateGraph(TicketState)
graph.add_node("classify", classify)  # routing node
graph.add_node("order", order_desk)
graph.add_node("product", product_desk)
graph.add_node("other", chitchat)
graph.add_edge(START, "classify")
graph.add_conditional_edges("classify", pick)  # thin edge
graph.add_edge("order", END)
graph.add_edge("product", END)
graph.add_edge("other", END)
app = graph.compile()

print("-" * 100)
for q in ["Status of ORD-1?", "Is the Mouse in stock?", "Hello!"]:
    r = app.invoke({"question": q, "intent": "", "answer": ""})
    print(f"Q: {q}\n  intent={r['intent']} → {r['answer']}\n")
print("-" * 100)
