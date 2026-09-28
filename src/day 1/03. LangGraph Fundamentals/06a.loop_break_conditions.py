# 06a — Breaking agent loops (should_continue pattern)
#
# Concept: agent loops (chatbot ↔ tools) need a stop condition.
#   tools_condition checks if model.tool_calls exists
#   Custom condition can limit attempts, check state fields, or timeout
#
# Limitation overcome: infinite loops when tools keep failing or model keeps calling.
#
# Example: order-support lookup with retry limit — stop after 3 failed lookups.
#
    10|# ```mermaid
# flowchart TD
#   START --> chatbot
#   chatbot -->|tool_calls + attempts<3| tools
#   chatbot -->|done or attempts>=3| END
#   tools --> chatbot
# ```

from typing import Annotated, TypedDict

    20|from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langchain.tools import tool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

load_dotenv()

    30|ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]
    attempts: int  # track how many tool cycles


@tool
def lookup_order(order_id: str) -> str:
    40|    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


tools = [lookup_order]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState) -> dict:
    return {
    50|        "messages": [model.invoke(state["messages"])],
        "attempts": state.get("attempts", 0) + 1,
    }


def should_continue(state: TicketState) -> str:
    """Custom condition: stop if no tool_calls OR too many attempts."""
    last_message = state["messages"][-1]
    
    # Check 1: no tool calls → done
    60|    if not getattr(last_message, "tool_calls", None):
        return "end"
    
    # Check 2: too many attempts → give up
    if state.get("attempts", 0) >= 3:
        return "give_up"
    
    # Otherwise continue to tools
    return "tools"

    70|
def give_up(state: TicketState) -> dict:
    return {"messages": [HumanMessage(content="Sorry, I tried 3 times but couldn't complete your request.")]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_node("give_up", give_up)
graph.add_edge(START, "chatbot")
    80|graph.add_conditional_edges(
    "chatbot",
    should_continue,
    {"end": END, "tools": "tools", "give_up": "give_up"}
)
graph.add_edge("tools", "chatbot")
graph.add_edge("give_up", END)
app = graph.compile()

print(app.get_graph().draw_mermaid())
    90|print("-" * 100)

# Normal case: lookup succeeds on first try
result = app.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1?")], "attempts": 0},
    config={"recursion_limit": 10}
)
print("Normal (1 attempt):", result["messages"][-1].content)
print("-" * 100)

   100|# Edge case: unknown order — agent might retry, but we cap at 3
result = app.invoke(
    {"messages": [HumanMessage(content="Status of ORD-999?")], "attempts": 0},
    config={"recursion_limit": 10}
)
print("Unknown order (capped attempts):", result["messages"][-1].content)
print("Total attempts:", result.get("attempts", 0))
print("-" * 100)

print("KEY PATTERN:")
   110|print("  tools_condition   → built-in: continues if tool_calls exist")
print("  should_continue() → custom: can check attempts, state fields, timeouts")
print("  Use when: you need stricter loop control than 'does tool_calls exist?'")
print("-" * 100)
