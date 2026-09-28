# 06 — Structured outputs (Pydantic models from model responses)
#
# Concept: with_structured_output(Schema) asks the model to return data
# that matches a Pydantic model (typed fields), not free text you parse later.
#
# When to use which:
#   Output parser (05)     — Model returns text; you parse it after
#                            (string, CSV list, JSON→dict). Good for simple
#                            text cleanup or when you only have a text chain.
#   Structured output (06) — You need a typed object (result.capital). Prefer
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
# Example: Capital answer as a typed Pydantic model (country, capital fields)

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

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Baseline (text response)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: Baseline (text response)")
print("═" * 100)
print()

text_result = model.invoke(messages).content
print(f"model.invoke (text): {text_result}")
print()
print("Problem: Free text - you'd need to parse 'Paris' out manually")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("model.invoke (text): The capital of France is Paris.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Structured output (Pydantic model)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 2: Structured output (Pydantic model)")
print("═" * 100)
print()

# KEY CODE SNIPPET: Bind Pydantic schema to model
structured = model.with_structured_output(CapitalInfo)
result = structured.invoke(messages)

print(f"Model with schema: model.with_structured_output(CapitalInfo)")
print(f"Result type: {type(result).__name__}")
print(f"Result: {result}")
print()
print(f"Access fields directly:")
print(f"  result.country = {result.country}")
print(f"  result.capital = {result.capital}")
print()
print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Model with schema: model.with_structured_output(CapitalInfo)")
print("Result type: CapitalInfo")
print("Result: country='France' capital='Paris'")
print()
print("Access fields directly:")
print("  result.country = France")
print("  result.capital = Paris")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("STRUCTURED OUTPUTS:")
print("  • Define Pydantic model with Field descriptions")
print("  • model.with_structured_output(Schema) binds schema to model")
print("  • Model generates JSON matching schema (enforced at generation time)")
print("  • You get typed Pydantic instance, not dict or string")
print()
print("LESSON 05 vs LESSON 06:")
print()
print("Lesson 05 - JsonOutputParser:")
print("  1. Prompt: 'Return JSON with format: {...}'")
print("  2. Model returns text (hopefully JSON)")
print("  3. Parser tries to parse text → dict")
print("  4. Can fail if model doesn't follow instructions")
print()
print("Lesson 06 - with_structured_output:")
print("  1. Schema bound to model at API level")
print("  2. Model generation constrained to schema")
print("  3. Always returns valid Pydantic instance")
print("  4. More reliable (generation-time enforcement)")
print()
print("WHEN TO USE:")
print("  ✓ Extracting entities from text")
print("  ✓ Building app data structures")
print("  ✓ Tool parameters (Day 1 Section 02)")
print("  ✓ Database records from natural language")
print()
print("BENEFITS:")
print("  ✓ Type-safe: result.capital (not result['capital'])")
print("  ✓ Validated: Pydantic checks types automatically")
print("  ✓ Reliable: Schema enforced at generation, not parsing")
print("  ✓ Clean code: No manual JSON parsing logic")
print()
print("NEXT LESSON:")
print("  07. streaming.py → Stream tokens as they're generated")
print("-" * 100)

