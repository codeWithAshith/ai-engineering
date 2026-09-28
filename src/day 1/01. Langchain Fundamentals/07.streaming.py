# 07 — Streaming (token-by-token responses)
#
# Concept: model.stream() yields tokens as they are generated (like ChatGPT UI);
# model.invoke() waits and returns the full AIMessage at once.
#
# Evolution of Streaming:
#   2020-2021: No streaming → wait 10s for full response → bad UX
#   2022 Q2: OpenAI streaming API → stream tokens as generated
#   2023 Q1: LangChain stream() method → standard across providers
#   2024-Present: All major providers support streaming (OpenAI, Anthropic, Groq, etc.)
#   Takeaway: Always stream for user-facing chat; invoke for batch/tools.
#
# Example: Stream France capital answer token by token (geography tutor)

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

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Baseline (invoke - wait for full response)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: model.invoke (wait for full response)")
print("═" * 100)
print()

response = model.invoke(messages).content
for chunk in model.stream(messages):
    print(chunk.content, end="", flush=True)
    sys.stdout.flush()
    time.sleep(0.04)  # Demo only - makes streaming visible in terminal
