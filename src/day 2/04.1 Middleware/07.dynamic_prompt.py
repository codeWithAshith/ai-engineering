# 07 — Dynamic prompt
#
# The system prompt is not fixed on the agent.
# @dynamic_prompt is middleware around the model node.
# It reads this run's context and returns the prompt for that call.

from dataclasses import dataclass

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ModelRequest, dynamic_prompt
from langchain.messages import HumanMessage

load_dotenv()


@dataclass
class Context:
    role: str


@dynamic_prompt
def role_prompt(request: ModelRequest) -> str:
    if request.runtime.context.role == "agent":
        return "You are order support. Answer in one short sentence. You may discuss order status."
    return "You are speaking to a customer. Answer in one short sentence. Do not offer to look up orders."


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    middleware=[role_prompt],
    context_schema=Context,
)

agent_turn = agent.invoke(
    {"messages": [HumanMessage(content="Can you check an order?")]},
    context=Context(role="agent"),
)
customer_turn = agent.invoke(
    {"messages": [HumanMessage(content="Can you check an order?")]},
    context=Context(role="customer"),
)
print("agent:", agent_turn["messages"][-1].content)
print("customer:", customer_turn["messages"][-1].content)
