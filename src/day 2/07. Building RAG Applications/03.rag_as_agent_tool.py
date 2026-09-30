# 03 — RAG as an agent tool
#
# Two tools. lookup_order answers a status. search_policies calls answer.
# Same two policy questions as RAG LangChain, plus the status question for the other tool.

from pathlib import Path
from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from langchain.tools import tool
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

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
ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


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


store = ingest(DATA)

SYSTEM = SystemMessage(
    content=(
        "You are Acme order support. "
        "Use lookup_order for ORD-* status. "
        "Use search_policies for refund, shipping, and contact questions."
    )
)


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def search_policies(query_text: str) -> str:
    """Search policy text and return the answer."""
    return answer(store, query_text)


tools = [lookup_order, search_policies]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)


def chatbot(state: TicketState) -> dict:
    return {"messages": [model.invoke([SYSTEM, *state["messages"]])]}


graph = StateGraph(TicketState)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")
app = graph.compile()

print("example 1")
print("question: Status of ORD-1?")
print(app.invoke({"messages": [HumanMessage(content="Status of ORD-1?")]})["messages"][-1].content)
print("-" * 40)

print("example 2")
print("question: What is the refund window?")
print(app.invoke({"messages": [HumanMessage(content="What is the refund window?")]})["messages"][-1].content)
print("-" * 40)

print("example 3")
print("question: quantum widget warranty on Mars")
print(app.invoke({"messages": [HumanMessage(content="quantum widget warranty on Mars")]})["messages"][-1].content)
print("-" * 40)
