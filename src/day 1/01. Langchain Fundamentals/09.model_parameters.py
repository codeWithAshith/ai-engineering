# 09 — Model parameters
#
# You'll learn: the three sampling knobs, when to touch one, and why this course
# almost always sets temperature and leaves the rest alone.
#
# The idea
#   The model does not pick "the best word". It picks from a list of next tokens,
#   each with a probability. These settings change that list — not the weights.
#
# The three knobs people mix up
#   temperature — how sharp the probabilities are.
#     0 ≈ always take the top token (focused, repeatable).
#     1 ≈ use the probabilities as-is (more variety).
#     This is the one we use in class.
#
#   top_p (nucleus) — only keep the smallest set of tokens whose probabilities
#     add up to p. top_p=0.9 means "ignore the long tail of unlikely words".
#     It is another way to cut randomness. You do not need it if temperature
#     is already 0.
#
#   top_k — only keep the k most likely tokens, then sample. Common in local /
#     Hugging Face models. Groq + init_chat_model here does not treat top_k as
#     a first-class argument, so we do not pass it.
#
# Why use top_p at all?
#   Use it when you want variety BUT you want to ban weird tail tokens.
#   Creative copy, brainstorming. Not tool calls, not SQL, not JSON.
#
# What if you set all three?
#   They stack: temperature reshapes the distribution, then top_k clips to k
#   tokens, then top_p clips to probability mass. You can do it, but you now
#   have three ways to make the model both boring and surprising, and you
#   cannot tell which knob did what. If the answer looks wrong, you will not
#   know what to turn.
#
# When to use all three
#   Almost never in production agents. Maybe in a research sweep where you log
#   every setting. For this course: pick one randomness knob.
#
# What is most common?
#   Agents / tools / structured output: temperature=0 (or 0.1). Leave top_p and
#   top_k unset. That is what we do from here on.
#   Chatty prose: temperature 0.7–1.0 OR top_p around 0.9 — not both cranked.
#   Prefer tuning temperature OR top_p, not both aggressively.
#
# Other params in this file
#   max_tokens — hard length cap. Style knobs do not do this.
#   stop — halt when this string appears.
#
# Run:
#   uv run python "src/day 1/01. Langchain Fundamentals/09.model_parameters.py"
#
# Example output (model wording changes; the four labels will match):
#   temperature=0 (focused):
#   Paris is the capital of France. ...
#   ----------------------------------------------------------------------------------------------------
#   temperature=1 (more varied):
#   A slightly different France fact (or extra flourish).
#   ----------------------------------------------------------------------------------------------------
#   max_tokens=64 (length cap — may truncate):
#   'Paris is ...'
#   usage_metadata: {'output_tokens': 64, ...}
#   ----------------------------------------------------------------------------------------------------
#   stop=['Interesting'] (halt when that word would start):
#   'Paris is the capital of France. '

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

messages = [
    SystemMessage(content="You are a geography tutor."),
    HumanMessage(content="What is the capital of France? Add one interesting fact."),
]

print("temperature=0 (focused):")
print(
    init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
    .invoke(messages)
    .content
)
print("-" * 100)

print("temperature=1 (more varied):")
print(
    init_chat_model(model="groq:openai/gpt-oss-20b", temperature=1)
    .invoke(messages)
    .content
)
print("-" * 100)

print("max_tokens=64 (length cap — may truncate):")
short = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0, max_tokens=64).invoke(
    messages
)
print(repr(short.content))
print("usage_metadata:", short.usage_metadata)
print("-" * 100)

print("stop=['Interesting'] (halt when that word would start):")
print(
    repr(
        init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0, stop=["Interesting"])
        .invoke(messages)
        .content
    )
)
print("-" * 100)
