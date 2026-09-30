# 05 — Semantic memory
#
# A fact, found by the meaning of the question.

import math

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool
from langgraph.store.memory import InMemoryStore

VOCAB = ["email", "phone", "call", "contact", "refund", "late", "ship"]


def embed(texts: list[str]) -> list[list[float]]:
    vectors = []
    for text in texts:
        words = text.lower().replace(".", " ").split()
        raw = [float(sum(token in word for word in words)) for token in VOCAB]
        norm = math.sqrt(sum(value * value for value in raw)) or 1.0
        vectors.append([value / norm for value in raw])
    return vectors


store = InMemoryStore(index={"embed": embed, "dims": len(VOCAB), "fields": ["text"]})
namespace = ("customers", "cust-42")
store.put(namespace, "contact", {"text": "Contact by email. Do not call."})
store.put(namespace, "shipping", {"text": "Last order ORD-1 has shipped."})

question = "Do we call this customer or email them?"
hit = store.search(namespace, query=question, limit=1)[0]
print(question)
print(hit.value["text"])
print("-" * 40)

# The agent uses the same store. A new thread has no chat, so the tool searches the fact.
load_dotenv()


@tool
def recall_fact(question: str, runtime: ToolRuntime) -> str:
    """Find a saved fact about this customer by the meaning of the question."""
    hits = runtime.store.search(("customers", "cust-42"), query=question, limit=1)
    if not hits:
        return "No fact saved."
    return hits[0].value["text"]


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[recall_fact],
    store=store,
    system_prompt="Use recall_fact. Answer in one short sentence. Do not invent a preference.",
)
reply = agent.invoke(
    {"messages": [HumanMessage(content="Do we call this customer or email them?")]},
    config={"configurable": {"thread_id": "semantic-new"}},
)
print("agent:", reply["messages"][-1].content)
