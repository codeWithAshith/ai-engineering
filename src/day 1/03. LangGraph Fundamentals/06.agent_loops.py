# 06 — Agent loops (with break conditions and error handling)
#
# Concept: chatbot ↔ ToolNode until the model stops calling tools.
#   tools_condition routes to tools or END
#   Custom conditions can add: retry limits, error routing, break logic
#
# Limitation overcome: a scripted normalize → enrich path cannot let the model
# decide when to look up ORD-1 / ORD-2. The ticket needs a cycle: model ↔ tools.
#
    10|# Evolution of Agent Loops:
#   2022: Manual while True loops with if tool_calls → error-prone, no observability
#   2023 Q1: AgentExecutor black box → couldn't inspect/pause/control mid-loop
#   2023 Q3: LangGraph tools_condition → transparent routing, but basic
#   2024–Present: Custom conditions + error routing + attempt limits → production-grade loops
#   Takeaway: Modern loops are observable, controllable, and fault-tolerant.
#
# Example: order-support graph with basic loop, then advanced: break conditions + errors.
#
    20|# ```mermaid
# flowchart TD
#   START --> chatbot
#   chatbot -->|tool_calls| tools
#   chatbot -->|done or too many attempts| END
#   tools -->|success| chatbot
#   tools -->|error + can retry| chatbot
#   tools -->|error + retry limit| give_up
#   give_up --> END
# ```

    30|import random
from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langchain.tools import tool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
    40|
load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


# ════════════════════════════════════════════════════════════════════════════
# PART 1: Basic agent loop
# ════════════════════════════════════════════════════════════════════════════
    50|
class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")
    60|

tools = [lookup_order]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke(state["messages"])]}


    70|graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)  # Built-in: continues if tool_calls exist
graph.add_edge("tools", "chatbot")
app = graph.compile()

print("═" * 100)
print("PART 1: Basic agent loop (tools_condition)")
    80|print("═" * 100)
print(app.get_graph().draw_mermaid())
print("-" * 100)

# recursion_limit caps graph steps (model↔tools cycles count)
result = app.invoke(
    {"messages": [HumanMessage(content="What is the status of order ORD-1?")]},
    config={"recursion_limit": 10},
)
print("Answer:", result["messages"][-1].content)
    90|print("recursion_limit=10 prevents infinite loops if model keeps calling tools")
print("-" * 100)


# ════════════════════════════════════════════════════════════════════════════
# PART 2: Custom break conditions (attempt limits)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
   100|print("PART 2: Custom break condition (stop after 3 tool attempts)")
print("═" * 100)


class StateWithAttempts(TypedDict):
    messages: Annotated[list, add_messages]
    attempts: int  # Track tool call cycles


def chatbot_with_counter(state: StateWithAttempts) -> dict:
   110|    return {
        "messages": [model.invoke(state["messages"])],
        "attempts": state.get("attempts", 0) + 1,
    }


def should_continue(state: StateWithAttempts) -> str:
    """Custom condition: stop if no tool_calls OR too many attempts."""
    last_message = state["messages"][-1]
    
   120|    # Check 1: no tool calls → done
    if not getattr(last_message, "tool_calls", None):
        return "end"
    
    # Check 2: too many attempts → give up
    if state.get("attempts", 0) >= 3:
        return "give_up"
    
    # Otherwise continue to tools
    return "tools"
   130|

def give_up_node(state: StateWithAttempts) -> dict:
    return {"messages": [HumanMessage(content="Sorry, I tried 3 times but couldn't complete your request.")]}


graph2 = StateGraph(StateWithAttempts)
graph2.add_node("chatbot", chatbot_with_counter)
graph2.add_node("tools", ToolNode(tools))
graph2.add_node("give_up", give_up_node)
   140|graph2.add_edge(START, "chatbot")
graph2.add_conditional_edges(
    "chatbot",
    should_continue,
    {"end": END, "tools": "tools", "give_up": "give_up"}
)
graph2.add_edge("tools", "chatbot")
graph2.add_edge("give_up", END)
app2 = graph2.compile()

   150|# Normal case: succeeds on first try
result = app2.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1?")], "attempts": 0},
    config={"recursion_limit": 10}
)
print("Normal case:", result["messages"][-1].content)
print("Attempts:", result.get("attempts", 0))
print("-" * 100)

# Edge case: unknown order might cause retries (capped at 3)
   160|result = app2.invoke(
    {"messages": [HumanMessage(content="Status of ORD-999?")], "attempts": 0},
    config={"recursion_limit": 10}
)
print("Unknown order:", result["messages"][-1].content)
print("Attempts:", result.get("attempts", 0))
print("-" * 100)


# ════════════════════════════════════════════════════════════════════════════
   170|# PART 3: Error handling in loops
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 3: Error handling (retry on failure, fallback after limit)")
print("═" * 100)


class StateWithErrors(TypedDict):
   180|    messages: Annotated[list, add_messages]
    error: str
    retries: int


@tool
def flaky_lookup(order_id: str) -> str:
    """Lookup that might fail (simulates flaky API)."""
    # 50% chance of failure
   190|    if random.random() < 0.5:
        raise Exception("API connection failed")
    return ORDERS.get(order_id, f"Order {order_id} not found")


def safe_chatbot(state: StateWithErrors) -> dict:
    """Chatbot that tracks errors."""
    return {"messages": [model.invoke(state["messages"])]}


   200|def safe_tools(state: StateWithErrors) -> dict:
    """ToolNode wrapper that catches errors."""
    try:
        tool_node = ToolNode([flaky_lookup])
        result = tool_node.invoke(state)
        return {**result, "error": ""}  # Clear error on success
    except Exception as e:
        return {
            "messages": [HumanMessage(content=f"Tool error: {e}")],
            "error": str(e),
   210|            "retries": state.get("retries", 0) + 1
        }


def route_after_tools(state: StateWithErrors) -> str:
    """Route based on error + retry count."""
    if not state.get("error"):
        return "chatbot"  # Success → continue loop
    
    if state.get("retries", 0) < 2:
   220|        return "tools"  # Error but can retry
    
    return "fallback"  # Retry limit hit


def fallback_node(state: StateWithErrors) -> dict:
    return {"messages": [HumanMessage(content=f"Sorry, system temporarily unavailable. Error: {state['error']}")]}


graph3 = StateGraph(StateWithErrors)
   230|graph3.add_node("chatbot", safe_chatbot)
graph3.add_node("tools", safe_tools)
graph3.add_node("fallback", fallback_node)
graph3.add_edge(START, "chatbot")
graph3.add_conditional_edges("chatbot", tools_condition)
graph3.add_conditional_edges(
    "tools",
    route_after_tools,
    {"chatbot": "chatbot", "tools": "tools", "fallback": "fallback"}
)
   240|graph3.add_edge("fallback", END)
app3 = graph3.compile()

# Run a few times to see success/retry/fallback paths
for i in range(3):
    result = app3.invoke({
        "messages": [HumanMessage(content="Status of ORD-1?")],
        "error": "",
        "retries": 0
   250|    })
    print(f"Run {i+1}: {result['messages'][-1].content[:50]}... (retries: {result.get('retries', 0)})")

print("-" * 100)


# ════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════════════════
   260|
print("═" * 100)
print("AGENT LOOP PATTERNS")
print("═" * 100)
print()
print("Part 1: Basic loop")
print("  tools_condition → built-in: continues if tool_calls exist")
print("  Use: 90% of agents, simple tool routing")
print()
print("Part 2: Custom break conditions")
   270|print("  should_continue() → check attempts, state fields, timeouts")
print("  Use: prevent infinite loops, budget-aware agents")
print()
print("Part 3: Error handling")
print("  Route after tool errors → retry or fallback")
print("  Use: production agents with flaky APIs")
print()
print("Pattern choice:")
print("  • Basic agent → tools_condition + recursion_limit")
print("  • Budget-aware → custom condition with attempt tracking")
   280|print("  • Production → error routing + retry limits + fallback")
print("-" * 100)
