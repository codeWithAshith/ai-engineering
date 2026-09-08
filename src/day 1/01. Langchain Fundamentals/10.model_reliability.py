# 10 — Model reliability
#
# Concept: wrap a model so failed calls retry or fall back to another model.
#   with_retry / with_fallbacks keep the same .invoke API
#
# Example: geography tutor call through a retry + fallback stack.

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

messages = [
    SystemMessage(content="You are a geography tutor. Answer in one short sentence."),
    HumanMessage(content="What is the capital of France?"),
]

primary = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
backup = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)

# Same API as model.invoke — with resilience
model = primary.with_retry(stop_after_attempt=3).with_fallbacks([backup])

print("reliable model.invoke →", model.invoke(messages).content)
print("-" * 100)
print("Stack: init_chat_model → with_retry → with_fallbacks → .invoke(messages)")
print("-" * 100)
