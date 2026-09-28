# 10 — Model reliability
#
# Concept: wrap a model so failed calls retry or fall back to another model.
#   with_retry / with_fallbacks keep the same .invoke API
#
# When to use:
#   Retry → transient failures (rate limits, timeouts, API hiccups)
#   Fallback → model unavailable, use backup provider
#
# Evolution of Reliability Patterns:
#   2023 Q1: Library helpers (tenacity) → but disconnected from LangChain
#   2023 Q2: LangChain .with_retry() → standardized retry logic
#   2023 Q3: .with_fallbacks() added → multi-provider resilience
#   2024–Present: Standard pattern = retry(3) + fallback(backup_model)
#   Takeaway: Production agents wrap models in retry+fallback layers.
#
# Example: geography tutor call through a retry + fallback stack.

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

print("Reliable model.invoke →", model.invoke(messages).content)
