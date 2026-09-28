# 13 — Short-term memory (InMemorySaver)
#
# Short-term memory is the current chat.
# InMemorySaver keeps that chat in RAM, under one thread_id.
# Same thread_id sees earlier turns. A different thread_id does not.
# Quit the process and the chat is gone. That is not long-term memory.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()

agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    system_prompt="You are a geography tutor. Answer in one short sentence. Use the chat.",
    checkpointer=InMemorySaver(),
)

france = {"configurable": {"thread_id": "france"}}
other = {"configurable": {"thread_id": "other"}}

agent.invoke({"messages": [HumanMessage(content="I am studying France.")]}, config=france)
remembered = agent.invoke(
    {"messages": [HumanMessage(content="What capital should I memorize?")]},
    config=france,
)
blank = agent.invoke(
    {"messages": [HumanMessage(content="What capital should I memorize?")]},
    config=other,
)

print("same thread:", remembered["messages"][-1].content)
print("other thread:", blank["messages"][-1].content)
