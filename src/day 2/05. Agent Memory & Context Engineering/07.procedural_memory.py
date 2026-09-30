# 07 — Procedural memory
#
# A rule loaded into the next system prompt.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
namespace = ("procedures", "order-support")
store.put(namespace, "late-shipment", {"text": "Greet the customer, then look up the order."})
print("before:", store.get(namespace, "late-shipment").value["text"])

store.put(
    namespace,
    "late-shipment",
    {"text": "When a shipment is late, offer the refund before asking them to wait."},
)
rule = store.get(namespace, "late-shipment").value["text"]
print("after:", rule)
print("-" * 40)

# The agent does not search. The saved rule is the system prompt for this run.
load_dotenv()

agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[],
    system_prompt=f"You handle order support. Standing rule: {rule} Answer in one short sentence.",
)
reply = agent.invoke(
    {"messages": [HumanMessage(content="ORD-1 is late. What should we do?")]},
)
print("agent:", reply["messages"][-1].content)
