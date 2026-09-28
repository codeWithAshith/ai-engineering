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
result = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=1).invoke(messages)
short = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0, max_tokens=64).invoke(
    messages
)
stopped = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0, stop=["Interesting"]).invoke(messages)
