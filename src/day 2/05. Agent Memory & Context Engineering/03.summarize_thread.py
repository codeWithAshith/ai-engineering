# 03 — Summarize the thread
#
# InMemorySaver keeps this chat under one thread_id.
# SummarizationMiddleware replaces the old turns with one summary
# once the thread passes the trigger. The recent messages stay.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware
from langchain.messages import HumanMessage
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()

agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[],
    checkpointer=InMemorySaver(),
    system_prompt="You are order support. Answer in one short sentence.",
    middleware=[
        SummarizationMiddleware(
            model="groq:openai/gpt-oss-20b",
            trigger=("messages", 6),
            keep=("messages", 2),
        )
    ],
)

cfg = {"configurable": {"thread_id": "ord-1"}}
turns = [
    "ORD-1 was a gift.",
    "Contact me by email, not phone.",
    "The box arrived damaged.",
    "Where is ORD-1?",
]

for text in turns:
    agent.invoke({"messages": [HumanMessage(content=text)]}, config=cfg)

print("thread the saver is holding:")
for message in agent.get_state(cfg).values["messages"]:
    text = message.content
    if isinstance(text, list):
        text = " ".join(part.get("text", "") for part in text if isinstance(part, dict))
    print(f"  {type(message).__name__}: {str(text)[:240]}")
