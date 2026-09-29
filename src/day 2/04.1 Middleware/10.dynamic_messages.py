# 10 — Dynamic messages
#
# The checkpointer can keep the whole thread.
# @wrap_model_call drops earlier messages only for a viewer.
# An agent on the same call still sees the email.

from dataclasses import dataclass

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ModelRequest, wrap_model_call
from langchain.messages import HumanMessage

load_dotenv()


@dataclass
class Context:
    role: str


@wrap_model_call
def latest_only_for_viewer(request: ModelRequest, handler):
    messages = request.messages
    if request.runtime.context.role == "viewer":
        messages = request.messages[-1:]
    print(f"  {request.runtime.context.role}: in {len(request.messages)} sent {len(messages)}")
    return handler(request.override(messages=messages))


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[],
    middleware=[latest_only_for_viewer],
    context_schema=Context,
    system_prompt="Answer in one short sentence. If you were not told an email, say you do not know it.",
)

thread = [
    HumanMessage(content="My email is ada@example.com."),
    HumanMessage(content="What email did I just give you?"),
]

for role in ("viewer", "agent"):
    result = agent.invoke({"messages": thread}, context=Context(role=role))
    print(f"  {role} said:", result["messages"][-1].content)
