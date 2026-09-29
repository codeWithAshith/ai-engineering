# 05 — Agent handoff (routing to specialist agents)
#
# Concept: a coordinator agent routes tickets to specialist agents (subgraphs).
#   Main agent — classifies intent, routes to refund / tracking / general
#   Specialist agents — each has domain-specific tools and system prompt
#
# Differs from routing nodes (04.routing_nodes): here entire agent graphs
# are subgraphs, not single tool-calling nodes.
#
# Use when: different intents need different agent behaviors, tools, or models.
#
# Example: order-support coordinator → refund specialist, tracking specialist, or general.

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from langchain.tools import tool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

# ────────────────────────────────────────────────────────────────────────────
# SPECIALIST AGENTS (as subgraphs)
# ────────────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    intent: str  # set by coordinator

# --- Refund specialist agent ---
@tool
def check_refund_eligibility(order_id: str) -> str:
    """Check if an order is eligible for refund."""
    status = ORDERS.get(order_id, None)
    if not status:
        return f"Order {order_id} not found."
    if status == "shipped":
        return f"Order {order_id} is eligible for refund (3-5 business days)."
    return f"Order {order_id} status is {status}; contact support for refund policy."


@tool
def issue_refund(order_id: str, amount: float) -> str:
    """Issue a refund (simulation)."""
    return f"Refund of ${amount:.2f} issued for {order_id}."

refund_tools = [check_refund_eligibility, issue_refund]
refund_model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(refund_tools)
REFUND_SYS = SystemMessage(content="You are a refund specialist. Use tools to check eligibility and issue refunds.")

def refund_agent_node(state: AgentState) -> dict:
    return {"messages": [refund_model.invoke([REFUND_SYS, *state["messages"]])]}

refund_graph = StateGraph(AgentState)
refund_graph.add_node("chatbot", refund_agent_node)
refund_graph.add_node("tools", ToolNode(refund_tools))
refund_graph.add_edge(START, "chatbot")
refund_graph.add_conditional_edges("chatbot", tools_condition)
refund_graph.add_edge("tools", "chatbot")
refund_agent = refund_graph.compile()

# --- Tracking specialist agent ---
@tool
def lookup_tracking(order_id: str) -> str:
    """Look up tracking number for an order."""
    return f"Tracking for {order_id}: TRACK-{order_id}-ABC123"

tracking_tools = [lookup_tracking]
tracking_model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tracking_tools)
TRACKING_SYS = SystemMessage(content="You are a tracking specialist. Use lookup_tracking for shipping details.")

def tracking_agent_node(state: AgentState) -> dict:
    return {"messages": [tracking_model.invoke([TRACKING_SYS, *state["messages"]])]}

tracking_graph = StateGraph(AgentState)
tracking_graph.add_node("chatbot", tracking_agent_node)
tracking_graph.add_node("tools", ToolNode(tracking_tools))
tracking_graph.add_edge(START, "chatbot")
tracking_graph.add_conditional_edges("chatbot", tools_condition)
tracking_graph.add_edge("tools", "chatbot")
tracking_agent = tracking_graph.compile()

# --- General support agent (no tools, just friendly chat) ---
general_model = init_chat_model(model="groq:openai/gpt-oss-20b")
GENERAL_SYS = SystemMessage(content="You are general support. Be friendly and helpful.")

def general_agent_node(state: AgentState) -> dict:
    return {"messages": [general_model.invoke([GENERAL_SYS, *state["messages"]])]}

general_graph = StateGraph(AgentState)
general_graph.add_node("chatbot", general_agent_node)
general_graph.add_edge(START, "chatbot")
general_graph.add_edge("chatbot", END)
general_agent = general_graph.compile()

# ────────────────────────────────────────────────────────────────────────────
# COORDINATOR AGENT
# ────────────────────────────────────────────────────────────────────────────

def classify(state: AgentState) -> dict:
    """Classify intent from the customer question."""
    q = state["messages"][0].content.lower()
    if "refund" in q:
        intent = "refund"
    elif "track" in q or "shipping" in q:
        intent = "tracking"
    else:
        intent = "general"
    return {"intent": intent}


def route(state: AgentState) -> str:
    """Route to specialist agent based on intent."""
    return state["intent"]


# Main coordinator graph
coordinator = StateGraph(AgentState)
coordinator.add_node("classify", classify)
coordinator.add_node("refund", refund_agent)     # compiled subgraph
coordinator.add_node("tracking", tracking_agent) # compiled subgraph
coordinator.add_node("general", general_agent)   # compiled subgraph
coordinator.add_edge(START, "classify")
coordinator.add_conditional_edges(
    "classify",
    route,
    {"refund": "refund", "tracking": "tracking", "general": "general"}
)
coordinator.add_edge("refund", END)
coordinator.add_edge("tracking", END)
coordinator.add_edge("general", END)
app = coordinator.compile()

print("-" * 100)

# Test all three paths
for question in [
    "Can I get a refund for ORD-1?",
    "What's the tracking number for ORD-2?",
    "Hello, thank you for your help!"
]:
    result = app.invoke(
        {"messages": [HumanMessage(content=question)], "intent": ""},
        config={"recursion_limit": 15}
    )
    print(f"Q: {question}")
    print(f"  Intent: {result['intent']}")
    print(f"  Answer: {result['messages'][-1].content}\n")

print("-" * 100)
print("HANDOFF PATTERNS:")
print("  Routing node (lesson 04)  → single graph, intent chooses desk function")
print("  Agent handoff (this)       → coordinator routes to specialist AGENT subgraphs")
print("  Use when: different intents need separate tools, models, or behaviors")
print("-" * 100)
