# 09 — Dynamic model
#
# The model is not fixed for every caller.
# @wrap_model_call swaps request.model before this turn.
# Both names here are the same Groq model. The branch is the lesson.

from dataclasses import dataclass

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ModelRequest, wrap_model_call
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage

load_dotenv()

viewer_model = init_chat_model("groq:openai/gpt-oss-20b")
agent_model = init_chat_model("groq:openai/gpt-oss-20b")


@dataclass
class Context:
    role: str


@wrap_model_call
def pick_model(request: ModelRequest, handler):
    role = request.runtime.context.role
    chosen = agent_model if role == "agent" else viewer_model
    print(f"  {role} -> {chosen.model}")
    return handler(request.override(model=chosen))


agent = create_agent(
    model=viewer_model,
    tools=[],
    middleware=[pick_model],
    context_schema=Context,
    system_prompt="Reply with one word: ready.",
)

for role in ("viewer", "agent"):
    agent.invoke(
        {"messages": [HumanMessage(content="Ready?")]},
        context=Context(role=role),
    )
