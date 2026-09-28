# 02 — Context limits and trimming
#
# Concept: models have a fixed token budget. When threads grow long:
#   Problem: Extra tokens = higher cost, noise, truncation
#   Solution: trim_messages keeps only recent history for the model
#
# Evolution of Context Management:
#   2022: No limits → threads grew unbounded → models degraded or crashed
#   2023 Q1: Manual slicing (history[-10:]) → fragile, breaks mid-conversation
#   2023 Q2: trim_messages introduced → smart token-aware truncation
#   2024–Present: Middleware auto-trims + summarizes as context grows
#   Takeaway: Context management is now declarative, not manual slicing.
#
# Limitation overcome: Day 1 agents append messages forever.
# Still limited: trimming drops facts — long-term prefs need Store (next lesson).
#
# Note: Day 1 checkpointer still stores the full thread on disk.
# trim_messages only affects what the MODEL sees in each invoke.

# ════════════════════════════════════════════════════════════════════════════
# PART 1: Demonstrating the context overflow problem
# ════════════════════════════════════════════════════════════════════════════

MESSAGES = [
    "Customer: Status of ORD-1?",
    "Agent: Looking up ORD-1… shipped.",
    "Customer: When will it arrive?",
    "Agent: Shipping policy says 3–5 days after shipped.",
    "Customer: Can I refund if late?",
    "Agent: Refund window is 45 days with receipt.",
] * 8  # Simulate many back-and-forth turns


def rough_tokens(text: str) -> int:
    """Rough estimate: 1 token per word."""
    return max(1, len(text.split()))


total = sum(rough_tokens(m) for m in MESSAGES)
print("═" * 100)
print("PART 1: Context overflow problem")
print("═" * 100)
print(f"Turns in thread: {len(MESSAGES)}")
print(f"Rough token estimate: {total}")
print(f"If model limit were 200 tokens → this thread exceeds budget")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# PART 2: Trimming messages to fit budget
# ════════════════════════════════════════════════════════════════════════════

from langchain.messages import AIMessage, HumanMessage, trim_messages
from langchain_core.messages.utils import count_tokens_approximately

history = []
for i in range(12):
    history.append(HumanMessage(content=f"Follow-up {i} about ORD-1 shipping"))
    history.append(AIMessage(content=f"Update {i}: still shipped, ETA unchanged"))

print("═" * 100)
print("PART 2: trim_messages solution")
print("═" * 100)
print(f"Full history: {len(history)} messages")

# Trim to fit 80 tokens, keeping most recent messages
trimmed = trim_messages(
    history,
    max_tokens=80,
    token_counter=count_tokens_approximately,
    strategy="last",  # Keep most recent
    start_on="human",  # Ensure conversation starts with user
)

print(f"After trim: {len(trimmed)} messages fit in budget")
print()
print("Kept messages:")
for m in trimmed:
    print(f"  {m.type}: {m.content[:60]}...")
print("-" * 100)

print("TRIM STRATEGIES:")
print("  'last'  → Keep most recent N messages (default, best for chat)")
print("  'first' → Keep oldest N messages (rare use case)")
print()
print("WHAT GETS DROPPED:")
print("  • Older messages fall off the window")
print("  • Model cannot see dropped context")
print("  • Checkpointer still has full thread on disk")
print()
print("WHEN TO USE:")
print("  ✓ Long support threads (keep context manageable)")
print("  ✓ Token budget enforcement (cost control)")
print("  ✓ Recent context more important than old")
print()
print("WHEN NOT ENOUGH:")
print("  ✗ Need to remember customer preferences across sessions → use Store")
print("  ✗ Need to recall facts from early in thread → use summarization")
print("-" * 100)
