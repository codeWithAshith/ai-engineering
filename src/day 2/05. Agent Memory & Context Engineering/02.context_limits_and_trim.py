# 02 — Context limits and trim
#
# trim_messages returns a shorter copy for this model call.
# history itself is unchanged. The checkpointer would still hold the full thread.
#
# max_tokens       budget for that copy
# token_counter    how size is counted. Approximate tokens, or len for messages.
# strategy="last"  keep the newest messages that fit. "first" keeps the oldest.
# start_on="human" the copy must open on a human message. Only valid with strategy="last".
# include_system   keep the system message even when it sits outside the window. Only with strategy="last".
# allow_partial    False drops a message that does not fit. True cuts that message.

from langchain.messages import AIMessage, HumanMessage, SystemMessage, trim_messages
from langchain_core.messages.utils import count_tokens_approximately

history = [SystemMessage(content="You are order support. Be brief.")]
for i in range(6):
    history.append(HumanMessage(content=f"Follow-up {i} about ORD-1 shipping"))
    history.append(AIMessage(content=f"Update {i}: still shipped, ETA unchanged"))


def show(label, messages):
    print(label)
    for message in messages:
        print(f"  {message.type}: {message.content}")
    print()


show(f"full thread ({len(history)} messages)", history)

show(
    "last 80 tokens, must start on human",
    trim_messages(
        history,
        max_tokens=80,
        token_counter=count_tokens_approximately,
        strategy="last",
        start_on="human",
        include_system=False,
        allow_partial=False,
    ),
)

show(
    "same budget, keep the system line too",
    trim_messages(
        history,
        max_tokens=80,
        token_counter=count_tokens_approximately,
        strategy="last",
        start_on="human",
        include_system=True,
    ),
)

show(
    "first 80 tokens — the old opening, not the latest update",
    trim_messages(
        history,
        max_tokens=80,
        token_counter=count_tokens_approximately,
        strategy="first",
    ),
)

show(
    "last 4 messages, counted with len",
    trim_messages(
        history,
        max_tokens=4,
        token_counter=len,
        strategy="last",
        start_on="human",
    ),
)
