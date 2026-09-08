# 02 — Messages
#
# Concept: a conversation is a list of typed message objects.
#   SystemMessage — instructions for the model
#   HumanMessage  — user text
#   AIMessage     — model replies (used as history)
#
# Example: multi-turn geography tutor chat, then model.invoke(messages).

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import AIMessage, HumanMessage, SystemMessage

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

messages = [
    SystemMessage(content="You are a geography tutor. Answer in one short sentence."),
    HumanMessage(content="What is the capital of Germany?"),
    AIMessage(content="The capital of Germany is Berlin."),
    HumanMessage(content="What about France?"),  # follows from history
]

result = model.invoke(messages)

for m in messages:
    print(f"{type(m).__name__}: {m.content}")
print("-" * 100)
print("model.invoke →", result.content)
print("-" * 100)
