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
    10|#   2022: Manual try/except everywhere → boilerplate hell
#   2023 Q1: Library helpers (tenacity) → but disconnected from LangChain
#   2023 Q2: LangChain .with_retry() → standardized retry logic
#   2023 Q3: .with_fallbacks() added → multi-provider resilience
#   2024–Present: Standard pattern = retry(3) + fallback(backup_model)
#   Takeaway: Production agents wrap models in retry+fallback layers.
#
# Example: geography tutor call through a retry + fallback stack.

    20|from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

messages = [
    SystemMessage(content="You are a geography tutor. Answer in one short sentence."),
    HumanMessage(content="What is the capital of France?"),
]
    30|
primary = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)
backup = init_chat_model(model="groq:openai/gpt-oss-20b", temperature=0)

# Same API as model.invoke — with resilience
model = primary.with_retry(stop_after_attempt=3).with_fallbacks([backup])

print("Reliable model.invoke →", model.invoke(messages).content)
print("-" * 100)
print("Stack: init_chat_model → with_retry → with_fallbacks → .invoke(messages)")
    40|print("-" * 100)

# ────────────────────────────────────────────────────────────────────────────
# What triggers retry vs fallback?
# ────────────────────────────────────────────────────────────────────────────

print("WHEN EACH LAYER ACTIVATES:")
print()
print("with_retry (stop_after_attempt=3):")
    50|print("  Retries on:")
print("    - Rate limit errors (429 Too Many Requests)")
print("    - Timeout errors (request took too long)")
print("    - Transient network failures (connection reset)")
print("  Does NOT retry on:")
print("    - Invalid API key (permanent failure)")
print("    - Model not found (wrong model name)")
print()
print("with_fallbacks([backup_model]):")
print("  Falls back when:")
    60|print("    - All retries exhausted")
print("    - Primary model unavailable (503, 502)")
print("    - Primary provider has outage")
print("  Backup model must:")
print("    - Accept same message format")
print("    - Support same tool schema (if using tools)")
print("-" * 100)

# ────────────────────────────────────────────────────────────────────────────
# Simulating failures (demonstration only)
    70|# ────────────────────────────────────────────────────────────────────────────

print("EXAMPLE FAILURE SCENARIOS:")
print()
print("Scenario 1: Rate limit (retries work)")
print("  First call: 429 Too Many Requests")
print("  Retry 1: 429 Too Many Requests")
print("  Retry 2: 200 OK ✓")
print("  Result: Success after 2 retries")
print()
    80|print("Scenario 2: Outage (fallback works)")
print("  Primary: 503 Service Unavailable")
print("  Retry 1: 503 Service Unavailable")
print("  Retry 2: 503 Service Unavailable")
print("  Retry 3: 503 Service Unavailable")
print("  Fallback: Switch to backup_model → 200 OK ✓")
print("  Result: Success via fallback")
print()
print("Scenario 3: Invalid key (neither works)")
print("  Primary: 401 Unauthorized")
    90|print("  Retries: skipped (permanent error)")
print("  Fallback: 401 Unauthorized")
print("  Result: Exception raised (cannot recover)")
print("-" * 100)

print("PRODUCTION PATTERN:")
print("  model = (")
print("    init_chat_model(primary)")
print("      .with_retry(stop_after_attempt=3)")
print("      .with_fallbacks([backup_model])")
   100|print("  )")
print()
print("  Order matters:")
print("    1. Retry first (cheap, same provider)")
print("    2. Fallback second (expensive, different provider)")
print("-" * 100)
