# 06 — Episodic memory
#
# One past case: situation, action, outcome.

import math

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool
from langgraph.store.memory import InMemoryStore

VOCAB = ["late", "refund", "ship", "address", "wrong", "email", "policy"]


def embed(texts: list[str]) -> list[list[float]]:
    vectors = []
    for text in texts:
        words = text.lower().replace(".", " ").split()
        raw = [float(sum(token in word for word in words)) for token in VOCAB]
        norm = math.sqrt(sum(value * value for value in raw)) or 1.0
        vectors.append([value / norm for value in raw])
    return vectors


store = InMemoryStore(index={"embed": embed, "dims": len(VOCAB), "fields": ["text"]})
namespace = ("episodes", "support")
store.put(
    namespace,
    "tkt-42",
    {"text": "Late shipment of ORD-1. Action: refunded. Outcome: customer satisfied."},
)
store.put(
    namespace,
    "tkt-18",
    {"text": "Wrong address on ORD-9. Action: updated address. Outcome: resent."},
)

question = "Package is late. What did we do last time?"
hit = store.search(namespace, query=question, limit=1)[0]
print(question)
print(f"{hit.key} — {hit.value['text']}")
print("-" * 40)

# The agent uses the same store. The tool returns the closest past case, not the old transcript.
load_dotenv()


@tool
def recall_case(question: str, runtime: ToolRuntime) -> str:
    """Find the closest past support case for this situation."""
    hits = runtime.store.search(("episodes", "support"), query=question, limit=1)
    if not hits:
        return "No past case."
    return f"{hits[0].key}: {hits[0].value['text']}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[recall_case],
    store=store,
    system_prompt="Use recall_case. Answer in one short sentence from that case.",
)
reply = agent.invoke(
    {"messages": [HumanMessage(content="Package is late. What did we do last time?")]},
    config={"configurable": {"thread_id": "episodic-new"}},
)
print("agent:", reply["messages"][-1].content)
