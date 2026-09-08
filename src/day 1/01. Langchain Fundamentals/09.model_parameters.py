# 09 — Model parameters
#
# Concept: init_chat_model(..., **params) changes how the model generates text.
# You still call model.invoke — only the settings differ.
#
# Params we pass directly on this model (no model_kwargs):
#
# | Param                | What it controls                                      |
# |----------------------|-------------------------------------------------------|
# | temperature          | Randomness / focus                                    |
# | max_tokens           | Length cap                                            |
# | stop                 | Halt on a string                                      |
# | timeout / max_retries| Client reliability → lesson 10                        |
#
# Related ideas (often on other providers; not first-class here):
#   top_p              — nucleus sampling (narrow the token set by probability mass)
#   presence_penalty   — prefer new topics (penalize any token already seen)
#   frequency_penalty  — cut repetition (penalize by how often a token repeated)
#   Prefer tuning temperature OR top_p, not both aggressively.
#
# Details:
#
#   temperature (0–2, often 0–1)
#     0 ≈ deterministic / focused; higher ≈ more varied / creative.
#
#   max_tokens
#     Hard cap on generated length (style params do not do this).
#
#   stop / stop_sequences
#     Stop when this string appears (content-based; max_tokens is count-based).
#
# Example: same France capital question under different settings.

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
