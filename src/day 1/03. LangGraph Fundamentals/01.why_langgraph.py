# 01 — Why LangGraph
#
# Concept: a chain is linear — A → B → C → stop.
# LangGraph is for when a ticket needs more than a straight line:
#   cycles       — go back (retry lookup, agent ↔ tools)
#   branching    — pick the next desk from ticket state
#   shared state — many nodes read/write the same ticket fields
#
# Limitation overcome: a plain chain can only do normalize → lookup → reply → stop.
# It cannot: lookup → miss → lookup again → then stop.
#
# Example: order-support for ORD-3 (cancelled order that needs special handling).
# We'll solve the SAME problem THREE ways to see why LangGraph matters.

from typing import TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import END, START, StateGraph

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending", "ORD-3": "cancelled"}

# ────────────────────────────────────────────────────────────────────────────
# APPROACH 1: Simple LLM call (no chain, no graph) — FAILS on branching
# ────────────────────────────────────────────────────────────────────────────
print("APPROACH 1: Simple LLM call (no workflow) — limited control")
model = init_chat_model(model="groq:openai/gpt-oss-20b")
result = model.invoke([
    SystemMessage(content="You are order support. Known orders: ORD-1=shipped, ORD-2=pending, ORD-3=cancelled. Cancelled orders need escalation."),
    HumanMessage(content="Status of ORD-3?")
])
print("  Answer:", result.content)
print("  Problem: model might not escalate; you have no control over the logic path.")
print("-" * 100)

# ────────────────────────────────────────────────────────────────────────────
# APPROACH 2: Chain (fixed workflow) — FAILS on conditional branching
# ────────────────────────────────────────────────────────────────────────────
print("APPROACH 2: Chain (linear workflow) — cannot branch on state")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are order support. Order {order_id} status: {status}. If cancelled, say ESCALATE."),
    ("human", "What should I tell the customer?")
])
chain = prompt | model | StrOutputParser()

# Manually look up first (chain cannot decide this)
oid = "ORD-3"
status = ORDERS.get(oid, "not found")
result = chain.invoke({"order_id": oid, "status": status})
print(f"  Order: {oid} → {status}")
print(f"  Answer: {result}")
print("  Problem: chain is A→B→C; no way to route 'cancelled' to escalate node vs 'shipped' to normal reply.")
print("-" * 100)

# ────────────────────────────────────────────────────────────────────────────
# APPROACH 3: LangGraph (state + branching) — SOLVES it
# ────────────────────────────────────────────────────────────────────────────
print("APPROACH 3: LangGraph (conditional routing + shared state) — correct")

class TicketState(TypedDict):
    order_id: str
    status: str
    answer: str

def normalize(state: TicketState) -> dict:
    """Step 1: normalize order id and lookup status"""
    oid = state["order_id"].strip().upper()
    status = ORDERS.get(oid, "not found")
    return {"order_id": oid, "status": status}

def route(state: TicketState) -> str:
    """Conditional edge: decide escalate vs normal based on status"""
    return "escalate" if state["status"] == "cancelled" else "normal"

def escalate(state: TicketState) -> dict:
    return {"answer": f"Order {state['order_id']} is cancelled — escalating to specialist team."}

def normal(state: TicketState) -> dict:
    return {"answer": f"Order {state['order_id']} status: {state['status']}."}

graph = StateGraph(TicketState)
graph.add_node("normalize", normalize)
graph.add_node("escalate", escalate)
graph.add_node("normal", normal)
graph.add_edge(START, "normalize")
graph.add_conditional_edges("normalize", route)  # branch on state
graph.add_edge("escalate", END)
graph.add_edge("normal", END)
app = graph.compile()

# Now run for both ORD-1 (normal) and ORD-3 (escalate)
for oid in ["ORD-1", "ORD-3"]:
    result = app.invoke({"order_id": oid, "status": "", "answer": ""})
    print(f"  {oid}: {result['answer']}")

print("  ✓ Graph correctly routes cancelled→escalate, shipped→normal")
print("-" * 100)

print("SUMMARY:")
print("  LLM alone  → no control over branching logic")
print("  Chain      → linear A→B→C; cannot route based on runtime state")
print("  LangGraph  → conditional edges read state and branch dynamically")
print("-" * 100)
