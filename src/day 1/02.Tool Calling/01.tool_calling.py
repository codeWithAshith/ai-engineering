# 01 — Tool calling (giving models access to functions)
#
# Concept: @tool turns a Python function into something the model can call.
# Two approaches:
#   1) Manual: bind_tools to model, you handle the tool loop
#   2) Agent: create_agent handles the loop for you
#
# Evolution of Tool Calling:
#   2021: No function calling → hack JSON output, parse, call functions
#   2022 Q2: OpenAI function calling introduced → model returns tool_calls
#   2023 Q1: LangChain @tool decorator → standardize tool definitions
#   2023 Q3: create_agent introduced → automated tool loops
#   2024-Present: All major models support tool calling natively
#   Takeaway: Function calling turned LLMs into action-taking agents.
#
# Example: Order support agent using lookup_order tool

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

# ════════════════════════════════════════════════════════════════════════════
# APPROACH 1: Manual tool calling (you handle the loop)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("APPROACH 1: Manual tool calling")
print("═" * 100)
print()

# KEY CODE SNIPPET: Bind tools to model, handle loop manually
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools([lookup_order])

# Step 1: Model decides to call tool
ai = model.invoke(question)
print(f"Step 1 - Model tool_calls: {ai.tool_calls}")

# Step 2: You run the tool
tool_messages = []
for call in ai.tool_calls:
    result = lookup_order.invoke(call["args"])
    tool_messages.append(ToolMessage(content=result, tool_call_id=call["id"]))

print(f"Step 2 - Tool result: {tool_messages[0].content}")

# Step 3: Send result back to model for final answer
final = model.invoke(question + [ai, *tool_messages])
print(f"Step 3 - Final answer: {final.content}")
print()

print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Step 1 - Model tool_calls: [{'name': 'lookup_order', 'args': {'order_id': 'ORD-1'}, 'id': '...'}]")
print("Step 2 - Tool result: shipped")
print("Step 3 - Final answer: The status of ORD-1 is shipped.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# APPROACH 2: Agent tool calling (loop handled for you)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("APPROACH 2: Agent (automated tool loop)")
print("═" * 100)
print()

# KEY CODE SNIPPET: create_agent handles the entire tool loop
agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order],
    system_prompt="You are order support. Use lookup_order for status questions.",
)

result = agent.invoke({"messages": question})
print(f"Agent answer: {result['messages'][-1].content}")
print()

print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Agent answer: The status of ORD-1 is shipped.")
print()
print("Behind the scenes: Agent automatically:")
print("  1. Detected need for lookup_order tool")
print("  2. Called lookup_order('ORD-1')")
print("  3. Got result 'shipped'")
print("  4. Generated final answer")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("TOOL DECORATOR:")
print("  @tool - Converts Python function to LangChain tool")
print("  • Docstring becomes tool description (model reads this!)")
print("  • Type hints define parameter schema")
print("  • Return value goes back to model")
print()
print("WHEN TO USE EACH APPROACH:")
print()
print("Manual (bind_tools):")
print("  ✓ Need custom tool loop logic")
print("  ✓ Want to inspect tool_calls before executing")
print("  ✓ Building multi-step workflows")
print()
print("Agent (create_agent):")
print("  ✓ Standard tool loop (model → tool → model)")
print("  ✓ Want memory/persistence (checkpointer)")
print("  ✓ Production use cases (most common)")
print()
print("NEXT LESSON:")
print("  02. errors_and_validation.py → Handle tool failures gracefully")
print("-" * 100)
