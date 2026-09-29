# 09 — Streaming
#
# Concept: app.stream modes show progress differently.
#
# When to use what:
# | Mode       | Each event is                         | When to use                                      |
# |------------|---------------------------------------|--------------------------------------------------|
# | "updates"  | {node_name: partial update}           | Debug / progress: which node just wrote what     |
# | "values"   | full TicketState after that step      | UI that re-renders the whole ticket each step    |
# | "messages" | (token_chunk, meta) from the LLM      | Last AI reply, token by token (typing)           |
# | invoke()   | one final state (not streaming)       | Same last AI reply, dumped once                  |
#
# How the four runs print (same question):
#   1) updates  → {'chatbot': ['AIMessage: Order ORD-1 has shipped.']}
#   2) values   → Human: the question, then Human + AI: the reply
#   3) messages → pieces of the AI sentence
#   4) invoke() → that sentence once
#
# messages vs invoke(): both are only the last AI response.
#   messages  — typing effect
#   invoke()  — wait, then the whole sentence
# HumanMessage / the ticket are updates and values, not these two.
#
# Limitation overcome: invoke() hides the ticket reply until everything finishes.
# Support UIs need partial updates and tokens as they arrive.
#
# Example: same question, four watches.
#   Graph: START → chatbot → END. No tools. We are not looking up ORD-1.
#   Question: "Write one sentence: order ORD-1 has shipped."
#   Run it four times. Only stream_mode (or invoke) changes.
# Still limited: one stream mode at a time — chatbots need thinking (tool steps)
# and answer tokens together.

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

load_dotenv()


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


model = init_chat_model(model="groq:openai/gpt-oss-20b")


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke(state["messages"])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_edge(START, "chatbot")
graph.add_edge("chatbot", END)
app = graph.compile()

print("-" * 100)

QUESTION = "Write one sentence: order ORD-1 has shipped."
inputs = {"messages": [HumanMessage(content=QUESTION)]}
print("Question:", QUESTION)
print("Graph:    START → chatbot → END  (no tools)")
print("-" * 100)


def preview(msg):
    return f"{type(msg).__name__}: {getattr(msg, 'content', '')}"


# 1) updates — only what the node returned
print("1) updates  — only what chatbot just returned")
for event in app.stream(inputs, stream_mode="updates"):
    node, update = next(iter(event.items()))
    print({node: [preview(m) for m in update.get("messages", [])]})
print("-" * 100)

# 2) values — whole ticket: the question, then the question plus the reply
print("2) values  — whole ticket after each step")
for state in app.stream(inputs, stream_mode="values"):
    for msg in state["messages"]:
        who = "Human" if type(msg).__name__ == "HumanMessage" else "AI"
        print(f"   {who}: {msg.content}")
    print()
print("-" * 100)

# 3) messages — pieces of the AI sentence while it writes
print("3) messages  — pieces of the AI sentence")
for chunk, _meta in app.stream(inputs, stream_mode="messages"):
    text = getattr(chunk, "content", None) or ""
    if text:
        print(text, end="", flush=True)
print()
print("-" * 100)

# 4) invoke — that same sentence, once, after the wait
print("4) invoke()  — the sentence once")
out = app.invoke(inputs)
print(out["messages"][-1].content)
print("-" * 100)
