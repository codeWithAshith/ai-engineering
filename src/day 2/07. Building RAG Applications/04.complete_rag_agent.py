# 04 — Complete RAG agent
#
# create_agent. lookup_order, search_policies, save_pref, get_prefs.
# Same refund question and Mars fallback, then the preference turns.
# Summarization folds a long thread. This short demo does not reach that trigger.

from pathlib import Path

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import (
    ClearToolUsesEdit,
    ContextEditingMiddleware,
    SummarizationMiddleware,
)
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.memory import InMemoryStore

load_dotenv()

DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"
FALLBACK = "I don't have policy context for that. Email help@acme.example."
POLICY_HINTS = ("refund", "ship", "email", "vip", "express", "ord", "delivery", "contact")
PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", "Acme order support. Answer from this policy text only:\n{context}"),
        ("human", "{question}"),
    ]
)
MODEL = init_chat_model(model="groq:openai/gpt-oss-20b")
ORDERS = {"ORD-1": "shipped", "ORD-2": "pending", "ORD-3": "delivered"}


def ingest(folder: Path) -> InMemoryVectorStore:
    docs = [
        Document(page_content=path.read_text(encoding="utf-8").strip(), metadata={"source": path.name})
        for path in sorted(folder.glob("*.txt"))
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    return InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))


def query(store: InMemoryVectorStore, question: str) -> str:
    if not any(hint in question.lower() for hint in POLICY_HINTS):
        return FALLBACK
    hits = store.similarity_search(question, k=3)
    if not hits:
        return FALLBACK
    sources = sorted({hit.metadata["source"] for hit in hits})
    context = "\n\n".join(f"[{hit.metadata['source']}] {hit.page_content}" for hit in hits)
    return f"sources: {sources}\n{context}"


def answer(store: InMemoryVectorStore, question: str) -> str:
    found = query(store, question)
    if found == FALLBACK:
        return FALLBACK
    sources, context = found.split("\n", 1)
    reply = (PROMPT | MODEL).invoke({"context": context, "question": question})
    return f"{reply.content}\n{sources}"


policy_store = ingest(DATA)
memory = InMemoryStore()


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def search_policies(question: str) -> str:
    """Search refund, shipping, and contact policy text."""
    return answer(policy_store, question)


@tool
def save_pref(key: str, value: str, runtime: ToolRuntime) -> str:
    """Save a customer preference."""
    runtime.store.put(("customers", "cust-42"), key, {"value": value})
    return f"Saved {key}={value}"


@tool
def get_prefs(runtime: ToolRuntime) -> str:
    """List saved customer preferences."""
    items = list(runtime.store.search(("customers", "cust-42")))
    if not items:
        return "No preferences saved."
    return ", ".join(f"{item.key}={item.value['value']}" for item in items)


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, search_policies, save_pref, get_prefs],
    store=memory,
    checkpointer=MemorySaver(),
    system_prompt=(
        "You are order support. "
        "Use lookup_order for status, search_policies for policy, save_pref and get_prefs for contact."
    ),
    middleware=[
        SummarizationMiddleware(model="groq:openai/gpt-oss-20b", trigger=("messages", 10), keep=("messages", 4)),
        ContextEditingMiddleware(
            edits=[ClearToolUsesEdit(trigger=2500, keep=3, placeholder="[old tool result cleared]")]
        ),
    ],
)

cfg = {"configurable": {"thread_id": "support-complete-demo"}}

print("example 1")
print("question: What is the refund window?")
reply = agent.invoke({"messages": [HumanMessage(content="What is the refund window?")]}, config=cfg)
print(reply["messages"][-1].content)
print("-" * 40)

print("example 2")
print("question: quantum widget warranty on Mars")
reply = agent.invoke({"messages": [HumanMessage(content="quantum widget warranty on Mars")]}, config=cfg)
print(reply["messages"][-1].content)
print("-" * 40)

print("example 3")
print("question: What is the status of ORD-1?")
reply = agent.invoke({"messages": [HumanMessage(content="What is the status of ORD-1?")]}, config=cfg)
print(reply["messages"][-1].content)
print("-" * 40)

print("example 4")
print("question: Save preference contact=email for me.")
reply = agent.invoke({"messages": [HumanMessage(content="Save preference contact=email for me.")]}, config=cfg)
print(reply["messages"][-1].content)
print("-" * 40)

print("example 5")
print("question: What's my contact preference? Also status of ORD-2 and how many days for refunds?")
reply = agent.invoke(
    {"messages": [HumanMessage(content="What's my contact preference? Also status of ORD-2 and how many days for refunds?")]},
    config=cfg,
)
print(reply["messages"][-1].content)
print("-" * 40)
