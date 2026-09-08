# 06 — Context summarization
#
# Concept: replace old ORD-* turns with a short summary to free window space.
#
# Limitation overcome: trim_messages drops detail; a summary keeps the gist.
# Still limited: summaries still sit in-chat — noisy tool dumps need compaction.
#
# Example: summarize a long shipping discussion about ORD-1.

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

old_thread = """
Customer asked about ORD-1 status (shipped).
Asked ETA — told 3–5 days after shipped.
Asked refund if late — told 45-day window with receipt.
Preferred email contact, not phone.
"""

model = init_chat_model(model="groq:openai/gpt-oss-20b")
summary = model.invoke(
    [
        SystemMessage(
            content="Summarize this order-support thread in 2 short sentences. Keep order id and prefs."
        ),
        HumanMessage(content=old_thread),
    ]
)
print("summary for next context:")
print(summary.content)
print("-" * 100)
