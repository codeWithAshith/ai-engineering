# 03 — trim_messages
#
# Concept: trim_messages keeps only a token budget of recent history for the model.
#
# Limitation overcome: a long ORD-* thread overflows the window (lesson 02).
# Still limited: trimming drops facts — long-term prefs need a Store.
#
# Day 1 checkpointer still stores full thread; trim only affects what the model sees.

from langchain.messages import AIMessage, HumanMessage, trim_messages
from langchain_core.messages.utils import count_tokens_approximately

history = []
for i in range(12):
    history.append(HumanMessage(content=f"Follow-up {i} about ORD-1 shipping"))
    history.append(AIMessage(content=f"Update {i}: still shipped, ETA unchanged"))

trimmed = trim_messages(
    history,
    max_tokens=80,
    token_counter=count_tokens_approximately,
    strategy="last",
    start_on="human",
)

print("full messages:", len(history))
print("trimmed messages:", len(trimmed))
for m in trimmed:
    print(f"  {m.type}: {m.content[:60]}")
print("-" * 100)
