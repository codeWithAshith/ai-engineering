# 02 — Context windows
#
# Concept: models only see a fixed token budget. Extra tokens = cost, noise, truncation.
#
# Limitation overcome: Day 1 agents keep appending messages forever.
# Example: rough token estimate for a long ORD-1 support thread.
# Still limited: knowing the budget does not shrink the thread yet.
#
# (Not re-teaching checkpointers — only the window problem.)

MESSAGES = [
    "Customer: Status of ORD-1?",
    "Agent: Looking up ORD-1… shipped.",
    "Customer: When will it arrive?",
    "Agent: Shipping policy says 3–5 days after shipped.",
    "Customer: Can I refund if late?",
    "Agent: Refund window is 45 days with receipt.",
] * 8  # pretend many turns


def rough_tokens(text: str) -> int:
    return max(1, len(text.split()))


total = sum(rough_tokens(m) for m in MESSAGES)
print(f"turns packed: {len(MESSAGES)}")
print(f"rough token estimate: {total}")
print("if limit were 200 → this thread would need trim / summarize / store")
print("-" * 100)
