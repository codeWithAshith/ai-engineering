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
print(f"Single question: {single_response.content}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Single question: The capital of France is Paris.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Batch processing (multiple questions)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 2: Batch processing (3 questions at once)")
print("═" * 100)
print()

# KEY CODE SNIPPET: Batch multiple independent requests
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
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Batch size: 3 questions")
print()
print("Results:")
print("  France: The capital of France is Paris.")
print("  Germany: The capital of Germany is Berlin.")
print("  Italy: The capital of Italy is Rome.")
print()
print("Performance: 3 questions in ~same time as 1 (parallel execution)")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("BATCH PROCESSING:")
print("  • model.batch([inputs]) → process multiple requests")
print("  • Runs in parallel (when provider supports it)")
print("  • Returns list of results in same order as inputs")
print()
print("PERFORMANCE COMPARISON:")
print()
print("Loop approach (slow):")
print("  for input in inputs:")
print("      result = model.invoke(input)  # Sequential: N × latency")
print("  Time: 3 questions × 2s = 6s total")
print()
print("Batch approach (fast):")
print("  results = model.batch(inputs)  # Parallel: 1 × latency")
print("  Time: 3 questions in ~2s total (3x faster!)")
print()
print("WHEN TO USE:")
print("  ✓ Multiple independent questions (capitals, translations, etc.)")
print("  ✓ Bulk data processing (classify 100 support tickets)")
print("  ✓ A/B testing prompts (run 5 variants on same input)")
print("  ✓ Evaluation (test model on 50 examples)")
print()
print("WHEN NOT TO USE:")
print("  ✗ Requests depend on each other (use loop or agent)")
print("  ✗ Streaming required (batch returns full responses only)")
print("  ✗ Single question (just use invoke)")
print()
print("PRODUCTION TIP:")
print("  • Most providers limit concurrency (~10 parallel requests)")
print("  • For 1000+ items, chunk batches: batch(items[0:100]), batch(items[100:200]), ...")
print()
print("NEXT LESSON:")
print("  09. model_parameters.py → Control randomness with temperature")
print("-" * 100)
