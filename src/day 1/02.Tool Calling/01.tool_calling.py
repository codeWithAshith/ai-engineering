# 01 — Tool calling
#
# Concept: @tool turns a Python function into something the model can call.
# Two ways:
#   1) Model directly — bind_tools, then you run the tool yourself
#   2) create_agent  — agent loop runs tools for you
#
# Example: order support — lookup_order for ORD-1.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, ToolMessage
from langchain.tools import tool

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def lookup_order(order_id: str) -> str:
    """Look up one order's status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


question = [HumanMessage(content="What is the status of ORD-1?")]

# --- 1) Model directly: you handle the tool loop ---
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools([lookup_order])
ai = model.invoke(question)
print("1) model tool_calls:", ai.tool_calls)

tool_messages = []
for call in ai.tool_calls:
    result = lookup_order.invoke(call["args"])
    tool_messages.append(ToolMessage(content=result, tool_call_id=call["id"]))

final = model.invoke(question + [ai, *tool_messages])
print("1) model answer:", final.content)
print("-" * 100)

# --- 2) create_agent: loop is built in ---
agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order],
    system_prompt="You are order support. Use lookup_order for status questions.",
)
result = agent.invoke({"messages": question})
print("2) agent answer:", result["messages"][-1].content)
print("-" * 100)
