# 06 — create_agent response_format (structured final answers)
#
# Concept: response_format asks the agent for a typed final answer (Pydantic).
# Result includes structured_response — like with_structured_output (lesson 01.06),
# but applied to the entire agent conversation, not just one model call.
# Use when the app needs fields (order_id, status), not only chat text.
#
# Evolution of Structured Agent Responses:
#   2022: Parse agent text with regex → fragile, error-prone
#   2023 Q1: Prompt "reply in JSON" → model sometimes ignored
#   2023 Q3: response_format on agents → enforced schema
#   2024-Present: Standard for apps that need structured data from agents
#   Takeaway: response_format turns conversational agents into API endpoints.
#
# Note: Some providers (including this Groq model) cannot combine JSON
# response_format with tools in the same call. Pattern:
#   tools lessons → facts via tools
#   this lesson  → typed reply via response_format (no tools in the same agent)
#
# Example: Order-support status as OrderStatus Pydantic object for ORD-1
#
# ```mermaid
# flowchart LR
#   user[User: status of ORD-1?] --> agent
#   agent -->|system prompt has data| model[Model with response_format]
#   model -->|JSON schema| pydantic[OrderStatus object]
#   pydantic --> app[structured_response field]
# ```

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
    response_format=OrderStatus,  # Enforce schema
)

print("═" * 100)
print("STRUCTURED AGENT RESPONSE")
print("═" * 100)

result = agent.invoke(
    {"messages": [HumanMessage(content="What is the status of ORD-1?")]}
)

print(f"structured_response: {result['structured_response']}")
print(f"Type: {type(result['structured_response']).__name__}")
print(f"Access fields: order_id={result['structured_response'].order_id}, status={result['structured_response'].status}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("structured_response: order_id='ORD-1' status='shipped' note='Your order has been shipped.'")
print("Type: OrderStatus")
print("Access fields: order_id=ORD-1, status=shipped")
print()
print("KEY CONCEPTS:")
print("  • Agent returns Pydantic object (not just text)")
print("  • App can access result['structured_response'].order_id directly")
print("  • Useful for: APIs, databases, workflows")
print("  • Limitation: Cannot combine with tools on some providers")
print("-" * 100)
