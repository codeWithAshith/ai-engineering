# 08 — Batch processing (multiple requests efficiently)
#
# Concept: model.batch([inputs…]) runs many independent prompts in one call
# instead of looping model.invoke yourself. More efficient, often parallel.
#
# Evolution of Batch Processing:
#   2020-2021: Loop model.invoke() → sequential, slow (N × latency)
#   2022 Q2: Manual async batching → complex, error-prone
#   2023 Q1: LangChain .batch() introduced → automatic parallelization
#   2024-Present: Batch with concurrency limits → production-ready
#   Takeaway: Use .batch() for multiple independent requests (10x faster than loop).
#
# Example: Ask capital questions for 3 countries in one batch

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

system = SystemMessage(content="You are a geography tutor. Answer in one short sentence.")

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Single invoke (baseline)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: Single invoke")
print("═" * 100)
print()

single_response = model.invoke([system, HumanMessage(content="What is the capital of France?")])
batch = [
    [system, HumanMessage(content="What is the capital of France?")],
    [system, HumanMessage(content="What is the capital of Germany?")],
    [system, HumanMessage(content="What is the capital of Italy?")],
]

results = model.batch(batch)

print(f"Batch size: {len(batch)} questions")
print()
print("Results:")
for country, result in zip(["France", "Germany", "Italy"], results):
    print(f"  {country}: {result.content}")
