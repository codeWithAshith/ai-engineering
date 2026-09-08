# 03 — Prompt templates and few-shot
#
# Concept: ChatPromptTemplate fills {variables} into a reusable prompt.
# Few-shot examples (Q→A pairs in the system text) steer format and tone
# without hard-coding a full chat history.
#
# Example: geography tutor template + a couple of capital examples.

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

# --- basic template ---
basic = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a geography tutor. Answer in one short sentence about {topic}."
        ),
        HumanMessagePromptTemplate.from_template("What is the capital of {country}?"),
    ]
)
messages = basic.invoke({"topic": "European capitals", "country": "France"})
print("basic:", model.invoke(messages).content)
print("-" * 100)

# --- few-shot: examples live in the system prompt ---
few_shot = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(
            "You are a geography tutor. Answer in one short sentence about {topic}.\n\n"
            "Examples:\n"
            "Q: What is the capital of Germany?\n"
            "A: Helloo,the capital of Germany is Berlin.\n"
            "Q: What is the capital of Spain?\n"
            "A: Helloo,the capital of Spain is Madrid."
        ),
        HumanMessagePromptTemplate.from_template("What is the capital of {country}?"),
    ]
)
messages = few_shot.invoke({"topic": "European capitals", "country": "Italy"})
print("few-shot Italy:", model.invoke(messages).content)
print("-" * 100)
