# 11 — Tool retry
#
# ToolRetryMiddleware retries a named tool after a timeout.
# A refund is not in that list, so a failed write is not run twice.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ToolRetryMiddleware
from langchain.messages import HumanMessage
from langchain.tools import tool

load_dotenv()

tries = {"lookup": 0}


@tool
def lookup_order(order_id: str) -> str:
    """Look up one order's status by id."""
    tries["lookup"] += 1
    if tries["lookup"] == 1:
        raise TimeoutError("lookup timed out")
    return f"{order_id} shipped"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order],
    system_prompt="Use lookup_order. Answer in one short sentence.",
    middleware=[
        ToolRetryMiddleware(
            max_retries=1,
            tools=["lookup_order"],
            initial_delay=0,
            backoff_factor=0,
            jitter=False,
        )
    ],
)

result = agent.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1?")]}
)
print("lookup calls:", tries["lookup"])
print(result["messages"][-1].content)
