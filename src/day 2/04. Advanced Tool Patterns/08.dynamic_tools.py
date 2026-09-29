# 08 — Dynamic tools
#
# The tool list is not fixed on the agent.
# @wrap_model_call is middleware around the model node.
# It replaces request.tools for this call, then the model runs.

from dataclasses import dataclass

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ModelRequest, wrap_model_call
from langchain.messages import HumanMessage
from langchain.tools import tool

load_dotenv()

ORDERS = {"ORD-1": "shipped"}


@dataclass
class Context:
    role: str


@tool
def lookup_order(order_id: str) -> str:
    """Look up one order's status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@wrap_model_call
def tools_for_role(request: ModelRequest, handler):
    if request.runtime.context.role == "agent":
        return handler(request.override(tools=[lookup_order]))
    return handler(request.override(tools=[], tool_choice="none"))


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order],
    middleware=[tools_for_role],
    context_schema=Context,
    system_prompt="Answer in one short sentence. Use lookup_order only if it is available.",
)

agent_turn = agent.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1?")]},
    context=Context(role="agent"),
)
customer_turn = agent.invoke(
    {"messages": [HumanMessage(content="Status of ORD-1?")]},
    context=Context(role="customer"),
)
print("agent:", agent_turn["messages"][-1].content)
print("customer:", customer_turn["messages"][-1].content)
