# 07 — Streaming
#
# Concept: model.stream() yields tokens as they are generated;
# model.invoke() waits and returns the full AIMessage at once.
#
# Example: stream the France capital answer token by token.

import sys
import time

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

messages = [
    SystemMessage(content="You are a geography tutor. Answer in 3–4 short sentences."),
    HumanMessage(content="What is the capital of France, and what is it known for?"),
]

print("model.invoke (all at once):")
print(model.invoke(messages).content)
print("-" * 100)

print("model.stream (chunk by chunk):")
for chunk in model.stream(messages):
    print(chunk.content, end="", flush=True)
    sys.stdout.flush()
    time.sleep(0.04)  # demo only — makes streaming visible
print()
print("-" * 100)
