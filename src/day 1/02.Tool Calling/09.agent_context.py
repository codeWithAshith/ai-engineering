# 09 — Agent context
#
# Concept: context is per-invoke data about the caller (role, user_id, …).
#   context_schema — type describing that data
#   invoke(..., context=...) — pass it for this run
#   ToolRuntime[Context] — tools read runtime.context
#
# Differs from messages (chat) and from checkpointer (thread memory).
# Example: order support — who_am_i reports the caller from context.

from dataclasses import dataclass

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool

load_dotenv()


@dataclass
class Context:
    user_id: str
    role: str


@tool
def who_am_i(runtime: ToolRuntime[Context]) -> str:
    """Return the current caller user_id and role from context."""
    ctx = runtime.context
    return f"user_id={ctx.user_id} role={ctx.role}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[who_am_i],
    context_schema=Context,
    system_prompt="Order support. Use who_am_i when asked who is calling.",
)

result = agent.invoke(
    {"messages": [HumanMessage(content="Who am I?")]},
    context=Context(user_id="u-42", role="viewer"),
)
print(result["messages"][-1].content)
print("-" * 100)
