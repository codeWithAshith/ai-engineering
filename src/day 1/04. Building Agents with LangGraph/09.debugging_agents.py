# 09 — Debugging agents
#
# Concept: agents fail in predictable ways. Learn to diagnose common issues.
#
# Common agent failures:
#   1. Calls wrong tool (or no tool)
#   2. Loops infinitely without finishing
#   3. Ignores tool results (hallucinates despite data)
#   4. Tool call args are wrong format
#
    10|# Debugging tools:
#   - graph.get_graph().draw_mermaid() → visualize flow
#   - app.stream(mode="updates") → see which nodes run
#   - app.get_state() → inspect state when paused
#   - print(msg.tool_calls) → see what model planned
#
# Evolution of Agent Debugging:
#   2022: Printf debugging + guesswork → hours lost
#   2023 Q1: AgentExecutor was black box → couldn't see inside loop
#   2023 Q3: LangGraph streaming exposed node transitions
    20|#   2024–Present: get_state + draw_mermaid + stream modes = full observability
#   Takeaway: Modern graphs are glass boxes, not black boxes.
#
# Example: diagnose why agent calls wrong tool or loops.

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
    30|from langchain.tools import tool
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}

    40|# ────────────────────────────────────────────────────────────────────────────
# SCENARIO 1: Agent calls wrong tool
# ────────────────────────────────────────────────────────────────────────────

@tool
def lookup_order(order_id: str) -> str:
    """Look up order."""  # ← Too vague!
    return ORDERS.get(order_id, "not found")

    50|@tool
def cancel_order(order_id: str) -> str:
    """Cancel order."""  # ← Too vague!
    return f"Cancelled {order_id}"


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

    60|tools = [lookup_order, cancel_order]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)
SYSTEM = SystemMessage(content="You are order support.")

def chatbot(state: AgentState) -> dict:
    return {"messages": [model.invoke([SYSTEM, *state["messages"]])]}

graph = StateGraph(AgentState)
graph.add_node("chatbot", chatbot)
    70|graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")
app = graph.compile()

print("SCENARIO 1: Vague tool docstrings → model confused")
print("Question: 'What is the status of ORD-1?'")
print()
    80|
# Debug step 1: Visualize graph
print("1) Visualize graph structure:")
print(app.get_graph().draw_mermaid()[:200] + "...")
print("-" * 100)

# Debug step 2: Stream to see which tools get called
print("2) Stream execution (mode='updates'):")
for event in app.stream(
    {"messages": [HumanMessage(content="What is the status of ORD-1?")]},
    90|    stream_mode="updates",
    config={"recursion_limit": 10}
):
    node = next(iter(event))
    if node == "chatbot":
        msg = event["chatbot"]["messages"][0]
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            print(f"  [chatbot] planned tool: {msg.tool_calls[0]['name']}")
    elif node == "tools":
        print(f"  [tools] executed: {event['tools']['messages'][0].name}")
   100|
print("-" * 100)

print("3) Diagnosis:")
print("  Problem: Model might call 'cancel_order' instead of 'lookup_order'")
print("  Root cause: Docstrings don't say WHEN to use each tool")
print("  Fix: Add clear docstrings with use-case examples (see lesson 07)")
print("-" * 100)


# ────────────────────────────────────────────────────────────────────────────
   110|# SCENARIO 2: Agent loops infinitely
# ────────────────────────────────────────────────────────────────────────────

@tool
def broken_lookup(order_id: str) -> str:
    """Look up order status."""
    return "Error: Database connection failed"  # ← Always returns error


print("SCENARIO 2: Tool returns error → model retries forever")
   120|print()

broken_tools = [broken_lookup]
broken_model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(broken_tools)

def broken_chatbot(state: AgentState) -> dict:
    return {"messages": [broken_model.invoke(state["messages"])]}

broken_graph = StateGraph(AgentState)
broken_graph.add_node("chatbot", broken_chatbot)
   130|broken_graph.add_node("tools", ToolNode(broken_tools))
broken_graph.add_edge(START, "chatbot")
broken_graph.add_conditional_edges("chatbot", tools_condition)
broken_graph.add_edge("tools", "chatbot")
broken_app = broken_graph.compile()

print("4) Run with recursion_limit to prevent infinite loop:")
try:
    result = broken_app.invoke(
        {"messages": [HumanMessage(content="Status of ORD-1?")]},
   140|        config={"recursion_limit": 3}  # Cap at 3 steps
    )
    print("  Result:", result["messages"][-1].content)
except Exception as e:
    print(f"  Caught: {type(e).__name__}")
    print("  Agent tried 3 times, then gave up (good!)")
print("-" * 100)

print("5) Diagnosis:")
print("  Problem: Tool keeps failing → model retries → hits recursion_limit")
   150|print("  Root cause: Tool error message doesn't say 'stop trying'")
print("  Fix: Return clear error + break condition (see lesson 06a)")
print("-" * 100)


# ────────────────────────────────────────────────────────────────────────────
# DEBUGGING CHECKLIST
# ────────────────────────────────────────────────────────────────────────────

   160|print("AGENT DEBUGGING CHECKLIST:")
print()
print("When agent fails, check in order:")
print("  1. Tool docstrings clear? (model reads these!)")
print("  2. System prompt specific? (not just 'you are helpful')")
print("  3. recursion_limit set? (default ~25, may be too high)")
print("  4. Stream mode='updates' → see which nodes run")
print("  5. print(msg.tool_calls) → see planned args")
print("  6. app.get_state() → inspect state at pause")
print("  7. Tool actually works? (test outside agent first)")
   170|print()
print("Common mistakes:")
print("  ❌ Vague tool names (get_data → what data?)")
print("  ❌ Missing docstrings (model guesses when to use)")
print("  ❌ Multi-purpose tools (do_action → too vague)")
print("  ❌ No recursion_limit (infinite loops)")
print("  ❌ Ignoring tool results in system prompt")
print("-" * 100)
