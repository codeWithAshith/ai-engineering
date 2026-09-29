# 14 — Tool selector
#
# The agent is registered with four tools.
# LLMToolSelectorMiddleware asks a model to keep only one for this question.
# The main model then sees that shorter list.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import LLMToolSelectorMiddleware
from langchain.messages import HumanMessage
from langchain.tools import tool

load_dotenv()


@tool
def lookup_order(order_id: str) -> str:
    """Look up one order's status by id."""
    return f"{order_id} shipped"


@tool
def issue_refund(order_id: str) -> str:
    """Issue a refund for an order."""
    return f"refund started for {order_id}"


@tool
def store_hours() -> str:
    """Return the shop opening hours."""
    return "9 to 5"


@tool
def menu() -> str:
    """Return today's menu."""
    return "tea, coffee"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, issue_refund, store_hours, menu],
    system_prompt="Use a tool. Answer in one short sentence.",
    middleware=[
        LLMToolSelectorMiddleware(
            model="groq:openai/gpt-oss-20b",
            max_tools=1,
        )
    ],
)

result = agent.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1?")]}
)
calls = [
    call["name"]
    for message in result["messages"]
    for call in getattr(message, "tool_calls", None) or []
]
print("tools called:", calls or "(none)")
print(result["messages"][-1].content)
