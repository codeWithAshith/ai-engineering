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
print(f"Response (all at once): {response}")
print()
print("User experience: Wait 2-5s → see full answer appear")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Response (all at once): The capital of France is Paris. It is known for the Eiffel Tower, the Louvre Museum, and its rich history and culture. Paris is also famous for its cuisine, fashion, and art.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Streaming (see tokens as generated)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 2: model.stream (token-by-token)")
print("═" * 100)
print()

print("Streaming response: ", end="", flush=True)

# KEY CODE SNIPPET: Stream tokens as they're generated
for chunk in model.stream(messages):
    print(chunk.content, end="", flush=True)
    sys.stdout.flush()
    time.sleep(0.04)  # Demo only - makes streaming visible in terminal

print()
print()
print("User experience: See answer appear word-by-word (like ChatGPT)")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Streaming response: The capital of France is Paris. [words appear gradually]")
print("It is known for the Eiffel Tower... [continues streaming]")
print()
print("User sees: The → capital → of → France → is → Paris → ...")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("STREAMING:")
print("  • model.stream() → yields chunks as tokens are generated")
print("  • Each chunk.content contains new token(s)")
print("  • Total latency same, but PERCEIVED latency much better")
print()
print("WHEN TO USE EACH:")
print()
print("model.invoke (batch):")
print("  ✓ Batch processing (many questions)")
print("  ✓ Tool calls (agents need full tool_calls)")
print("  ✓ Structured outputs (need complete JSON)")
print("  ✓ Background tasks (no user watching)")
print()
print("model.stream (interactive):")
print("  ✓ Chat interfaces (user waiting)")
print("  ✓ Long responses (don't make users wait)")
print("  ✓ Better UX (see progress immediately)")
print()
print("TECHNICAL NOTES:")
print("  • First token arrives ~200-500ms (time to first byte)")
print("  • Subsequent tokens ~20-50ms apart")
print("  • Total time same as invoke, but feels faster")
print()
print("NEXT LESSON:")
print("  08. batch_processing.py → Process multiple requests efficiently")
print("-" * 100)
