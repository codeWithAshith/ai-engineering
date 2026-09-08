# 08 — Batch processing
#
# Concept: model.batch([inputs…]) runs many independent prompts in one call
# instead of looping model.invoke yourself.
#
# Example: several "capital of …?" questions in one batch.

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

system = SystemMessage(content="You are a geography tutor. Answer in one short sentence.")

print("one invoke:")
print(model.invoke([system, HumanMessage(content="What is the capital of France?")]).content)
print("-" * 100)

batch = [
    [system, HumanMessage(content="What is the capital of France?")],
    [system, HumanMessage(content="What is the capital of Germany?")],
    [system, HumanMessage(content="What is the capital of Italy?")],
]

print("model.batch →", len(batch), "answers:")
for country, result in zip(["France", "Germany", "Italy"], model.batch(batch)):
    print(f"  {country}: {result.content}")
print("-" * 100)
