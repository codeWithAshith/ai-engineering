# 10 — RAG as an agent tool
#
# Concept: expose policy search as @tool; the Day-1-style agent decides WHEN to retrieve.
# Combines ORDERS lookup (structured) + policy RAG (unstructured).
#
# Limitation overcome: always-on retrieve→generate wastes calls and cannot mix tools.
# Example: status of ORD-1 via lookup_order; refund window via search_policies.

from pathlib import Path
from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage
from langchain.tools import tool
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}
DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"
embeddings = OllamaEmbeddings(model="nomic-embed-text")
docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
_retriever = InMemoryVectorStore.from_documents(
    RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs),
    embedding=embeddings,
).as_retriever(search_kwargs={"k": 2})

SYSTEM = SystemMessage(
    content=(
        "You are Acme order support. "
        "Use lookup_order for ORD-* status. "
        "Use search_policies for refund/shipping/contact policy questions."
    )
)


class TicketState(TypedDict):
    messages: Annotated[list, add_messages]


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def search_policies(query: str) -> str:
    """Search Acme order-support policy documents."""
    hits = _retriever.invoke(query)
    if not hits:
        return "No policy snippets found."
    return "\n---\n".join(f"[{d.metadata['source']}] {d.page_content}" for d in hits)


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

print(app.get_graph().draw_mermaid())
print("-" * 100)
for q in ["Status of ORD-1?", "What is the refund window?"]:
    r = app.invoke({"messages": [HumanMessage(content=q)]})
    print(f"Q: {q}\n  → {r['messages'][-1].content}\n")
print("-" * 100)
