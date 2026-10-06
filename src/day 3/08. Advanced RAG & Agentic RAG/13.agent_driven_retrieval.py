# 13 — Agent-driven retrieval
#
# Same desk. The model decides whether to search.
# Return ticket → call search_policies. Small talk → skip retrieval.

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

DATA = Path(__file__).parent.parent.parent / "day 2" / "06. RAG Fundamentals" / "data"
TICKET = "Can I return ORD-88421 and get money back to my card?"
CHITCHAT = "thanks, that helps"


def ingest(folder: Path) -> InMemoryVectorStore:
    docs = [
        Document(page_content=path.read_text(encoding="utf-8").strip(), metadata={"source": path.name})
        for path in sorted(folder.glob("*.txt"))
    ]
    chunks = RecursiveCharacterTextSplitter(chunk_size=140, chunk_overlap=30).split_documents(docs)
    print(f"ingest {len(docs)} docs → {len(chunks)} chunks")
    return InMemoryVectorStore.from_documents(chunks, embedding=OllamaEmbeddings(model="nomic-embed-text"))


store = ingest(DATA)


@tool
def search_policies(question: str) -> str:
    """Search Acme refund, shipping, and contact policies. Use for order or policy questions."""
    hits = store.similarity_search(question, k=3)
    if not hits:
        return "No policy context found."
    return "\n\n".join(f"[{hit.metadata['source']}] {hit.page_content}" for hit in hits)


class State(TypedDict):
    messages: Annotated[list, add_messages]


tools = [search_policies]
model = init_chat_model(model="groq:openai/gpt-oss-20b").bind_tools(tools)
SYSTEM = SystemMessage(
    content=(
        "You are Acme order support. "
        "Use search_policies for refund, shipping, order, or contact questions. "
        "Do not search for small talk."
    )
)


def chatbot(state: State) -> dict:
    return {"messages": [model.invoke([SYSTEM, *state["messages"]])]}


graph = StateGraph(State)
graph.add_node("chatbot", chatbot)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "chatbot")
graph.add_conditional_edges("chatbot", tools_condition)
graph.add_edge("tools", "chatbot")
app = graph.compile()

print("-" * 40)
for label, question in [("ticket (should search)", TICKET), ("chitchat (skip search)", CHITCHAT)]:
    print(label)
    print(f"message: {question}")
    result = app.invoke({"messages": [HumanMessage(content=question)]})
    tool_rounds = sum(1 for message in result["messages"] if getattr(message, "tool_calls", None))
    print(f"  tool rounds: {tool_rounds}")
    print(f"  answer: {result['messages'][-1].content}")
    print("-" * 40)
