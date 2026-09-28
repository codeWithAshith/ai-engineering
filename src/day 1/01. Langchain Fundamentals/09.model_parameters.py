# 09 — Model parameters
#
# You'll learn: temperature controls randomness; use 0 for tools/agents, higher for creative chat.
#
# The idea
#   The model doesn't pick "the best word." It samples from a probability distribution.
#   Temperature reshapes that distribution — making it sharper (focused) or flatter (varied).
#
# The one knob we actually use in this course
    10|#   temperature — how sharp the probabilities are.
#     0 ≈ always take the top token (focused, repeatable).
#     1 ≈ use the probabilities as-is (more variety).
#     This is the knob we set in production agents.
#
# Why not Top-K and Top-P?
#   They're additional filters that clip the candidate list before sampling.
#   For this course: temperature alone is enough.
#   - Tools/agents: temperature=0 (deterministic)
#   - Creative chat: temperature 0.7–1.0
    20|#   Leave Top-K and Top-P at defaults unless you have a specific reason.
#
# Other params in this file
#   max_tokens — hard length cap.
#   stop — halt when this string appears.
#
# Evolution of Sampling Parameters:
#   2022: Every tutorial stacked temperature + top_k + top_p "to be safe" → unpredictable chaos
#   2023 Q1: Research showed stacking all three made outputs LESS controllable
#   2023 Q2: LangChain defaulted to temperature-only for most use cases
    30|#   2024–Present: Production pattern = temperature 0 for structured tasks, leave others default
#   Takeaway: Don't stack knobs. Pick temperature, set it once, move on.
#
# Run:
#   uv run python "src/day 1/01. Langchain Fundamentals/09.model_parameters.py"
#
# Example output (model wording changes; the labels will match):
#   temperature=0 (focused):
#   Paris is the capital of France. ...
#   ----------------------------------------------------------------------------------------------------
    40|#   temperature=1 (more varied):
#   A slightly different France fact (or extra flourish).
#   ----------------------------------------------------------------------------------------------------
#   max_tokens=64 (length cap — may truncate):
#   'Paris is ...'
#   usage_metadata: {'output_tokens': 64, ...}
#   ----------------------------------------------------------------------------------------------------
#   stop=['Interesting'] (halt when that word would start):
#   'Paris is the capital of France. '

    50|from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

messages = [
    SystemMessage(content="You are a geography tutor."),
    HumanMessage(content="What is the capital of France? Add one interesting fact."),
]
    60|
print("temperature=0 (focused):")
result = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0).invoke(messages)
print(result.content)
print("Tokens used:", result.usage_metadata.get('total_tokens', 'N/A'))
print("Estimated cost: $", result.usage_metadata.get('total_tokens', 0) * 0.00001)
print("-" * 100)

print("temperature=1 (more varied):")
result = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=1).invoke(messages)
    70|print(result.content)
print("-" * 100)

print("max_tokens=64 (length cap — may truncate):")
short = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0, max_tokens=64).invoke(
    messages
)
print(repr(short.content))
print("usage_metadata:", short.usage_metadata)
print("-" * 100)
    80|
print("stop=['Interesting'] (halt when that word would start):")
print(
    repr(
        init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0, stop=["Interesting"])
        .invoke(messages)
        .content
    )
)
print("-" * 100)
    90|
print("PRODUCTION PATTERN:")
print("  Tools/agents/structured output → temperature=0")
print("  Creative chat/brainstorming → temperature 0.7–1.0")
print("  Leave top_k and top_p at defaults (don't stack all three)")
print("-" * 100)
