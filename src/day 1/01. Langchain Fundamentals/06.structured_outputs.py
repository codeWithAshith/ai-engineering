# 06 — Structured outputs
#
# Concept: with_structured_output(Schema) asks the model to return data
# that matches a Pydantic model (typed fields), not free text you parse later.
#
# When to use which:
#   Output parser (05)     — model returns text; you parse it after
#                            (string, CSV list, JSON→dict). Good for simple
#                            text cleanup or when you only have a text chain.
#   Structured output (06) — you need a typed object (result.capital). Prefer
#                            this for app data: schema is bound on the model,
#                            usually more reliable than "please reply in JSON".
#
# Evolution of Structured Output:
#   2022: Prompt "Reply in JSON" + regex scraping + json.loads() → crashes constantly
#   2023 Q1: OutputFixingParser auto-retries on parse errors → 2x cost, 5s latency added
#   2023 Q2: OpenAI function calling → JSON schema enforced at generation time
#   2023 Q4: Anthropic, Mistral, Groq adopt tool calling → universal schema support
#   2024–Present: with_structured_output() works across all providers via constrained decoding
#   Takeaway: Never use "please return JSON" prompts. Use with_structured_output.
#
# Example: capital answer as a small schema (country, capital, …).

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

load_dotenv()


class CapitalInfo(BaseModel):
    country: str = Field(description="Country name")
    capital: str = Field(description="Capital city")


model = init_chat_model(model="groq:openai/gpt-oss-20b")

messages = [
    SystemMessage(content="You are a geography tutor. Be concise and accurate."),
    HumanMessage(content="What is the capital of France?"),
]

print("model.invoke (text) →", model.invoke(messages).content)
print("-" * 100)

structured = model.with_structured_output(CapitalInfo)
result = structured.invoke(messages)

print("with_structured_output →", type(result).__name__)
print(result)
print(f"{result.capital} is the capital of {result.country}")
print("-" * 100)
print("Difference from lesson 05:")
print("  05 JsonOutputParser        → prompt asks for JSON → parse text → dict")
print("  06 with_structured_output  → schema on model → Pydantic (result.capital)")
print("-" * 100)
