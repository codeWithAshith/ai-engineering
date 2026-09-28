# 09 — Model parameters (controlling randomness)
#
# Concept: temperature controls randomness in generation.
#   The model doesn't pick "the best word" — it samples from a probability distribution.
#   Temperature reshapes that distribution: sharp (focused) or flat (varied).
#
# The one knob we actually use in this course:
#   temperature — how sharp the probabilities are
#     0 ≈ always take the top token (focused, repeatable)
#     1 ≈ use the probabilities as-is (more variety)
#     This is the knob we set in production agents.
#
# Why not Top-K and Top-P?
#   They're additional filters that clip the candidate list before sampling.
#   For this course: temperature alone is enough.
#   - Tools/agents: temperature=0 (deterministic)
#   - Creative chat: temperature 0.7–1.0
#   Leave Top-K and Top-P at defaults unless you have a specific reason.
#
# Other params in this lesson:
#   max_tokens — hard length cap
#   stop — halt when this string appears
#
# Evolution of Sampling Parameters:
#   2022: Every tutorial stacked temperature + top_k + top_p "to be safe" → unpredictable chaos
#   2023 Q1: Research showed stacking all three made outputs LESS controllable
#   2023 Q2: LangChain defaulted to temperature-only for most use cases
#   2024–Present: Production pattern = temperature 0 for structured tasks, leave others default
#   Takeaway: Don't stack knobs. Pick temperature, set it once, move on.
#
# Example: See how temperature, max_tokens, and stop parameters affect output

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

messages = [
    SystemMessage(content="You are a geography tutor."),
    HumanMessage(content="What is the capital of France? Add one interesting fact."),
]

# ════════════════════════════════════════════════════════════════════════════
# PART 1: temperature=0 (focused, deterministic)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: temperature=0 (focused)")
print("═" * 100)
print()

result = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0).invoke(messages)
print(f"Response: {result.content}")
print(f"Tokens used: {result.usage_metadata.get('total_tokens', 'N/A')}")
print(f"Estimated cost: ${result.usage_metadata.get('total_tokens', 0) * 0.00001:.6f}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Response: The capital of France is Paris. Interesting fact: Paris is home to the Eiffel Tower, which was completed in 1889.")
print("Tokens used: 45")
print("Estimated cost: $0.000450")
print()
print("Run again → SAME answer (deterministic)")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: temperature=1 (more varied, creative)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 2: temperature=1 (more varied)")
print("═" * 100)
print()

result = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=1).invoke(messages)
print(f"Response: {result.content}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Response: The capital of France is Paris. Fun fact: The city has over 400 parks and gardens!")
print()
print("Run again → DIFFERENT answer (more creative)")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 3: max_tokens (length cap)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 3: max_tokens=64 (length cap)")
print("═" * 100)
print()

short = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0, max_tokens=64).invoke(
    messages
)
print(f"Response (may truncate): {repr(short.content)}")
print(f"Usage metadata: {short.usage_metadata}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Response (may truncate): 'The capital of France is Paris. Interesting fact: Paris is home to the Eiffel Tower...'")
print("Usage metadata: {'output_tokens': 64, 'input_tokens': 28, 'total_tokens': 92}")
print()
print("Note: May cut off mid-sentence when hitting token limit")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 4: stop parameter (halt at specific string)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 4: stop=['Interesting'] (halt when word appears)")
print("═" * 100)
print()

stopped = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0, stop=["Interesting"]).invoke(messages)
print(f"Response (stops before 'Interesting'): {repr(stopped.content)}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Response (stops before 'Interesting'): 'The capital of France is Paris. '")
print()
print("Note: Generation halts when stop string would appear")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("TEMPERATURE:")
print("  • 0 = Deterministic (always pick top token)")
print("  • 0.7 = Balanced (default for most chat)")
print("  • 1.0 = Creative (more variety)")
print("  • 2.0 = Chaotic (rarely useful)")
print()
print("MAX_TOKENS:")
print("  • Hard cap on output length")
print("  • May truncate mid-sentence")
print("  • Use when you need strict length limits")
print()
print("STOP:")
print("  • List of strings that halt generation")
print("  • Useful for structured formats (stop at '---' separator)")
print("  • Generation ends when ANY stop string would appear")
print()
print("PRODUCTION PATTERNS:")
print()
print("temperature=0 (use for):")
print("  ✓ Tool calling / agents")
print("  ✓ Structured outputs")
print("  ✓ Deterministic behavior (testing, evaluation)")
print()
print("temperature=0.7-1.0 (use for):")
print("  ✓ Creative writing")
print("  ✓ Brainstorming")
print("  ✓ Chat interfaces")
print()
print("AVOID:")
print("  ✗ Stacking temperature + top_k + top_p (less controllable)")
print("  ✗ temperature > 1.5 (too chaotic for most use cases)")
print()
print("NEXT LESSON:")
print("  10. model_reliability.py → Handle model failures gracefully")
print("-" * 100)
