# 03 — Prompt templates and few-shot examples
#
# Concept: ChatPromptTemplate makes prompts reusable by filling {variables}.
# Few-shot examples (Q→A pairs in the system message) steer format and tone
# without hard-coding a full chat history.
#
# Evolution of Prompt Patterns:
#   2020-2021: Hardcoded strings per query → not reusable
#   2022 Q1: f-strings with variables → fragile, no validation
#   2022 Q3: LangChain PromptTemplate introduced → template validation
#   2023-Present: ChatPromptTemplate → multi-message templates
#   Takeaway: Templates make prompts maintainable and testable.
#
# Example: geography tutor with few-shot examples to control format.

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Basic template with variables
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("PART 1: Basic ChatPromptTemplate")
print("═" * 100)
print()

# KEY CODE SNIPPET: Basic template with variables
basic = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a geography tutor. Answer in one short sentence about {topic}."
        ),
        HumanMessagePromptTemplate.from_template("What is the capital of {country}?"),
    ]
)

messages = basic.invoke({"topic": "European capitals", "country": "France"})
response = model.invoke(messages).content
few_shot = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a geography tutor. Answer in one short sentence about {topic}.\n\n"
            "Examples:\n"
            "Q: What is the capital of Germany?\n"
            "A: Hello, the capital of Germany is Berlin.\n"
            "Q: What is the capital of Spain?\n"
            "A: Helloo, the capital of Spain is Madrid."
        ),
        HumanMessagePromptTemplate.from_template("What is the capital of {country}?"),
    ]
)

messages = few_shot.invoke({"topic": "European capitals", "country": "Italy"})
response = model.invoke(messages).content
