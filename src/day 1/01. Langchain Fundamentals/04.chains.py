# 04 — Chains (composing steps with |)
#
# Concept: The | pipe operator composes steps into one runnable.
#   prompt | model  means: fill the template, then call the model
#   chain.invoke(inputs) runs that pipeline end-to-end
#
# Evolution of Chain Composition:
#   2022: Manual composition (prompt.invoke, then model.invoke) — verbose, error-prone
#   2023 Q1: Chain classes (LLMChain, SimpleSequentialChain) — rigid, hard to customize
#   2023 Q2: LCEL | operator introduced — composable, standard interface
#   2024–Present: create_agent wraps LCEL + tools + memory as one API
#   Takeaway: Still see old LLMChain code? That's why we use | now. LCEL is the standard.
#
# Example: geography tutor prompt piped into the chat model

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

prompt = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a geography tutor. Answer in one short sentence about {topic}."
        ),
        HumanMessagePromptTemplate.from_template("What is the capital of {country}?"),
    ]
)

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Manual composition (lesson 03 pattern)
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: Manual composition (old way)")
print("═" * 100)
print()

messages = prompt.invoke({"topic": "European capitals", "country": "France"})
result = model.invoke(messages)

print(f"Step 1: prompt.invoke(inputs) → messages")
print(f"Step 2: model.invoke(messages) → {result.content}")
print()
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Chain composition with | operator (LCEL)
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 2: Chain with | operator (modern way)")
print("═" * 100)
print()

# KEY CODE SNIPPET: Compose steps with | operator
chain = prompt | model

ai_msg = chain.invoke({"topic": "European capitals", "country": "France"})

print(f"Chain: prompt | model")
print(f"Invoke: chain.invoke({{'topic': 'European capitals', 'country': 'France'}})")
print(f"Result type: {type(ai_msg).__name__}")
print(f"Content: {ai_msg.content}")
print()

print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Chain: prompt | model")
print("Invoke: chain.invoke({'topic': 'European capitals', 'country': 'France'})")
print("Result type: AIMessage")
print("Content: The capital of France is Paris.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 3: Reusing the chain with different inputs
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("PART 3: Chain reusability")
print("═" * 100)
print()

italy_result = chain.invoke({"topic": "European capitals", "country": "Italy"})
spain_result = chain.invoke({"topic": "European capitals", "country": "Spain"})

print("Same chain, different inputs:")
print(f"  Italy: {italy_result.content}")
print(f"  Spain: {spain_result.content}")
print()

print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Same chain, different inputs:")
print("  Italy: The capital of Italy is Rome.")
print("  Spain: The capital of Spain is Madrid.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("LCEL (LangChain Expression Language):")
print("  • | operator: Compose steps left-to-right")
print("  • chain.invoke(inputs): Run entire pipeline")
print("  • Type-safe: chain knows what inputs it needs")
print()
print("BENEFITS:")
print("  ✓ Less code: prompt | model (vs manual prompt.invoke, model.invoke)")
print("  ✓ Reusable: Same chain, many inputs")
print("  ✓ Composable: prompt | model | parser | ...")
print("  ✓ Standard: Works with any LangChain runnable")
print()
print("WHY | WON OVER OLD CHAIN CLASSES:")
print("  • Old: LLMChain(prompt=prompt, llm=model) → rigid, hard to extend")
print("  • New: prompt | model → flexible, compose anything")
print("-" * 100)
