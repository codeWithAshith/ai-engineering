# 07 — Context compaction
#
# Concept: shrink noisy middle content (long tool dumps) while keeping recent turns.
#
# Limitation overcome: summarization helps old chat; huge tool results still waste tokens.
# Still limited: production needs durable Store/checkpointer backends.
#
# Example: compact a verbose lookup_order tool payload for ORD-1.

tool_dump = (
    "lookup_order(ORD-1) raw="
    + str({"id": "ORD-1", "status": "shipped", "events": ["a"] * 40, "debug": "x" * 200})
)


def compact_tool_result(text: str, limit: int = 120) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 3] + "..."


print("before:", len(tool_dump), "chars")
print("after: ", compact_tool_result(tool_dump))
print("-" * 100)
