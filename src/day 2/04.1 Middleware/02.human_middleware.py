# 02 — A person approves the write
#
# One question: "Set ORD-1 to delivered."
# HumanInTheLoopMiddleware pauses before that tool runs.
# The thread stays in InMemorySaver until someone approves.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langchain.messages import HumanMessage
from langchain.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def update_order_status(order_id: str, status: str) -> str:
    """Change an order's status."""
    if order_id not in ORDERS:
        return f"Order {order_id} not found"
    ORDERS[order_id] = status
    return f"Updated {order_id} to {status}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[update_order_status],
    system_prompt="Use update_order_status when the customer asks to change a status.",
    checkpointer=InMemorySaver(),
    middleware=[HumanInTheLoopMiddleware(interrupt_on={"update_order_status": True})],
)

cfg = {"configurable": {"thread_id": "approve-ord-1"}}
paused = agent.invoke(
    {"messages": [HumanMessage(content="Set ORD-1 to delivered.")]},
    config=cfg,
)
print("paused:", paused.get("__interrupt__") is not None)

done = agent.invoke(Command(resume={"decisions": [{"type": "approve"}]}), config=cfg)
print("after approve:", done["messages"][-1].content)
print("ORDERS:", ORDERS)
