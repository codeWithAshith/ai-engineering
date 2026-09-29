# 13 — Model fallback
#
# The agent is built on a model name that fails.
# ModelFallbackMiddleware runs the Groq model for that same turn.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ModelFallbackMiddleware
from langchain.messages import HumanMessage

load_dotenv()

agent = create_agent(
    model="groq:model-that-does-not-exist",
    tools=[],
    system_prompt="Reply with one word: ready.",
    middleware=[ModelFallbackMiddleware("groq:openai/gpt-oss-20b")],
)

result = agent.invoke({"messages": [HumanMessage(content="Ready?")]})
print(result["messages"][-1].content)
