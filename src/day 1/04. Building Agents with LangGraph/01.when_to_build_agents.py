# 01 — When to build an agent
#
# Concept:
#   LLM app   — fixed prompt → one answer (no tools, no workflow)
#   Workflow  — you choose the path (fixed steps, deterministic routing)
#   Agent     — the model chooses the next action (tool calls, dynamic loops)
#
# Prefer an agent when steps or tool choice are unclear up front.
# Prefer a workflow when the steps are known and deterministic.
    10|#
# Example: SAME order-support question answered THREE ways.
#
# ```mermaid
# flowchart TD
#   question[Customer: Refund ORD-1?]
#   question -->|LLM app| llm[Single call - guesses]
#   question -->|Workflow| wf[Fixed: lookup then refund]
#   question -->|Agent| ag[Model decides: lookup? refund? both?]
# ```

    20|from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from langchain.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
    30|from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

# ────────────────────────────────────────────────────────────────────────────
# APPROACH 1: LLM app (one-shot, no data access)
# ────────────────────────────────────────────────────────────────────────────
    40|print("APPROACH 1: LLM app (single call, no real data)")
model = init_chat_model(model="groq:openai/gpt-oss-20b")
result = model.invoke([
    SystemMessage(content="You are order support. You have NO live order database."),
    HumanMessage(content="Can I get a refund for ORD-1?")
])
print("  Answer:", result.content)
print("  Use case: FAQs, chitchat, policy questions (no data lookup needed)")
print("  Problem: cannot check real order status")
print("-" * 100)
    50|
# ────────────────────────────────────────────────────────────────────────────
# APPROACH 2: Workflow (fixed path: always lookup → format → reply)
# ────────────────────────────────────────────────────────────────────────────
print("APPROACH 2: Workflow (fixed steps: normalize → lookup → format)")

class WorkflowState(TypedDict):
    order_id: str
    status: str
    60|    answer: str

def normalize(state: WorkflowState) -> dict:
    return {"order_id": state["order_id"].strip().upper()}

def lookup(state: WorkflowState) -> dict:
    return {"status": ORDERS.get(state["order_id"], "not found")}

def format_answer(state: WorkflowState) -> dict:
    return {"answer": f"Order {state['order_id']} is {state['status']}. Refund policy: shipped orders take 3-5 days."}
    70|
wf_graph = StateGraph(WorkflowState)
wf_graph.add_node("normalize", normalize)
wf_graph.add_node("lookup", lookup)
wf_graph.add_node("format", format_answer)
wf_graph.add_edge(START, "normalize")
wf_graph.add_edge("normalize", "lookup")
wf_graph.add_edge("lookup", "format")
wf_graph.add_edge("format", END)
wf_app = wf_graph.compile()
    80|
result = wf_app.invoke({"order_id": "ORD-1", "status": "", "answer": ""})
print("  Answer:", result["answer"])
print("  Use case: invoice processing, ETL, known multi-step flows")
print("  Problem: ALWAYS runs all steps; cannot skip lookup if customer just says 'hello'")
print("-" * 100)

# ────────────────────────────────────────────────────────────────────────────
# APPROACH 3: Agent (model decides which tools to call, and when)
# ────────────────────────────────────────────────────────────────────────────
    90|print("APPROACH 3: Agent (model chooses tools dynamically)")

@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")

@tool
def check_refund_policy(order_id: str) -> str:
    """Check refund eligibility for an order."""
   100|    status = ORDERS.get(order_id, None)
    if not status:
        return "Order not found; cannot check refund policy."
    if status == "shipped":
        return "Refund available: shipped orders take 3-5 days."
    return "Refund policy: contact support for pending orders."

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

   110|tools = [lookup_order, check_refund_policy]
model_with_tools = model.bind_tools(tools)

SYSTEM = SystemMessage(content="You are order support. Use tools to answer accurately.")

def chatbot(state: AgentState) -> dict:
    return {"messages": [model_with_tools.invoke([SYSTEM, *state["messages"]])]}

agent_graph = StateGraph(AgentState)
agent_graph.add_node("chatbot", chatbot)
   120|agent_graph.add_node("tools", ToolNode(tools))
agent_graph.add_edge(START, "chatbot")
agent_graph.add_conditional_edges("chatbot", tools_condition)
agent_graph.add_edge("tools", "chatbot")
agent_app = agent_graph.compile()

# Agent decides: does it need lookup? refund policy? both?
result = agent_app.invoke(
    {"messages": [HumanMessage(content="Can I get a refund for ORD-1?")]},
    config={"recursion_limit": 10}
   130|)
print("  Answer:", result["messages"][-1].content)
print("  Use case: support chat, research, multi-step reasoning where you DON'T know the path up front")
print("  ✓ Agent called both tools (or chose intelligently which to call)")
print("-" * 100)

print("SUMMARY:")
print("  LLM app   → no data, no workflow (FAQs, chitchat)")
print("  Workflow  → fixed steps (invoices, ETL, known pipelines)")
print("  Agent     → model decides tools/steps (support, research, unclear paths)")
   140|print("-" * 100)

print("Day 1 order-support examples:")
print("  ✗ 'Always: normalize ORD-* → lookup → email' → workflow/chain (steps known)")
print("  ✓ 'Order support: status, list, refund, tracking' → agent (tool choice unclear)")
print("  ✗ 'Invoice: extract → validate → save' → workflow/chain (fixed pipeline)")
print("-" * 100)
