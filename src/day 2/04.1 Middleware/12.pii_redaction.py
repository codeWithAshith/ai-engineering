# 12 — PII redaction
#
# PIIMiddleware redacts an email in the user message before the model sees it.
# The model is asked to quote the email. It can only quote the redacted form.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware
from langchain.messages import HumanMessage

load_dotenv()

agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[],
    system_prompt="Quote the user's email exactly, and nothing else.",
    middleware=[PIIMiddleware("email", strategy="redact", apply_to_input=True)],
)

result = agent.invoke(
    {"messages": [HumanMessage(content="My email is ada@example.com.")]}
)
print("model saw:", result["messages"][0].content)
print("model said:", result["messages"][-1].content)
