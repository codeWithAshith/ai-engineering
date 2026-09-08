# 04 — Chains
#
# Concept: the | pipe composes steps into one runnable.
#   prompt | model  means: fill the template, then call the model
#   chain.invoke(inputs) runs that pipeline
#
# Example: geography tutor prompt piped into the chat model.

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

# --- same as lesson 03 (explicit) ---
messages = prompt.invoke({"topic": "European capitals", "country": "France"})
print("manual model.invoke →", model.invoke(messages).content)
print("-" * 100)

# --- new: pipe operator ---
chain = prompt | model
ai_msg = chain.invoke({"topic": "European capitals", "country": "France"})
print("chain.invoke →", type(ai_msg).__name__, ":", ai_msg.content)
print("-" * 100)

print("Italy:", chain.invoke({"topic": "European capitals", "country": "Italy"}).content)
print("-" * 100)
