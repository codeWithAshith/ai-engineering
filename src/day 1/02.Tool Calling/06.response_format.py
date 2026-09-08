# 06 — create_agent response_format
#
# Concept: response_format asks the agent for a typed final answer (Pydantic).
# Result includes structured_response — like with_structured_output, but on the agent.
# Use when the app needs fields (order_id, status), not only chat text.
#
# Note: some providers (including this Groq model) cannot combine JSON
# response_format with tools in the same call. Pattern:
#   tools lessons → facts via tools
#   this lesson  → typed reply via response_format (no tools in the same agent)
#
# Example: order-support status as OrderStatus for ORD-1.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from pydantic import BaseModel, Field

load_dotenv()


class OrderStatus(BaseModel):
    order_id: str
    status: str
    note: str = Field(description="One short sentence for the customer")


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    system_prompt=(
        "You are order support. Known data: ORD-1=shipped, ORD-2=pending. "
        "Always fill OrderStatus from that data."
    ),
    response_format=OrderStatus,
)

result = agent.invoke(
    {"messages": [HumanMessage(content="What is the status of ORD-1?")]}
)
print("structured_response:", result["structured_response"])
print("type:", type(result["structured_response"]).__name__)
print("-" * 100)
