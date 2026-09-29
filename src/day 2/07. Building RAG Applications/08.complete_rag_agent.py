# 08 — Complete RAG agent (Day 1 + Day 2 integration)
#
# Concept: Production order-support agent combining ALL course concepts:
#   • Day 1: Structured tools (ORDERS lookup)
#   • Day 2 Section 04: Advanced tool patterns (middleware, governance)
#   • Day 2 Section 05: Agent memory (Store, context growth strategies)
#   • Day 2 Section 06/07: RAG (policy search over documents)
#
# What this file is:
#   One create_agent with the pieces from the earlier files: an ORDERS tool, a policy retriever tool, a Store, and context middleware.
#   Those pieces were not invented as a single product. This lesson is the first time this course wires them together.
#
# This lesson is your CAPSTONE:
#   - Tests understanding of entire curriculum
#   - Shows production architecture patterns
#   - Demonstrates how concepts compose
#
# ```mermaid
# flowchart TD
#   A[Customer question] --> B{Agent decides}
#   B -->|Structured data| C[lookup_order tool]
#   B -->|Policy question| D[search_policies RAG tool]
#   B -->|Remember preference| E[save_pref Store]
#   C --> F[Context middleware]
#   D --> F
#   E --> F
#   F --> G[Model with full context]
#   G --> H[Grounded answer + citations]
# ```

# ════════════════════════════════════════════════════════════════════════════
# SETUP: Components from across the curriculum
# ════════════════════════════════════════════════════════════════════════════

from pathlib import Path

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import (
    ClearToolUsesEdit,
    ContextEditingMiddleware,
    SummarizationMiddleware,
)
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.memory import InMemoryStore

load_dotenv()

print("═" * 100)
print("COMPLETE RAG AGENT: Day 1 + Day 2 Integration")
print("═" * 100)
print()

# ════════════════════════════════════════════════════════════════════════════
# COMPONENT 1: Structured data (Day 1)
# ════════════════════════════════════════════════════════════════════════════

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending", "ORD-3": "delivered"}

@tool
def lookup_order(order_id: str) -> str:
    """
    Look up order status by ID (structured data from Day 1).
    
    Use when customer asks:
    - "Status of ORD-1?"
    - "Where is my order ORD-2?"
    - "Has ORD-3 been delivered?"
    """
    return ORDERS.get(order_id, f"Order {order_id} not found")

print("Component 1: Structured tools (Day 1)")
print(f"  • ORDERS database: {len(ORDERS)} orders")
print(f"  • lookup_order tool: fast DB lookup")
print()

# ════════════════════════════════════════════════════════════════════════════
# COMPONENT 2: RAG over policy documents (Day 2 Sections 06/07)
# ════════════════════════════════════════════════════════════════════════════

# Build RAG index from policy documents
DATA = Path(__file__).parent.parent / "06. RAG Fundamentals" / "data"
embeddings = OllamaEmbeddings(model="nomic-embed-text")

docs = [
    Document(page_content=p.read_text(encoding="utf-8"), metadata={"source": p.name})
    for p in sorted(DATA.glob("*.txt"))
]
chunks = RecursiveCharacterTextSplitter(
    chunk_size=140, chunk_overlap=30
).split_documents(docs)
policy_retriever = InMemoryVectorStore.from_documents(
    chunks, embedding=embeddings
).as_retriever(search_kwargs={"k": 2})

@tool
def search_policies(question: str) -> str:
    """
    Search company policy documents (RAG from Day 2).
    
    Use when customer asks:
    - "What is the refund window?"
    - "How long is standard shipping?"
    - "What are your contact hours?"
    
    Returns: Policy excerpts with source citations.
    """
    hits = policy_retriever.invoke(question)
    if not hits:
        return "No relevant policy found."
    
    result = []
    for h in hits:
        preview = h.page_content[:120].replace('\n', ' ')
        result.append(f"[{h.metadata['source']}] {preview}...")
    
    return "\n\n".join(result)

print("Component 2: RAG over policy documents (Day 2 Sections 06/07)")
print(f"  • Indexed {len(chunks)} policy chunks")
print(f"  • search_policies tool: semantic search over refund/shipping/contact docs")
print()

# ════════════════════════════════════════════════════════════════════════════
# COMPONENT 3: Long-term memory (Day 2 Section 05)
# ════════════════════════════════════════════════════════════════════════════

store = InMemoryStore()

@tool
def save_pref(key: str, value: str, runtime: ToolRuntime) -> str:
    """
    Save customer preference to long-term Store (Day 2 Section 05).
    
    Use when customer says:
    - "Email me, don't call"
    - "Always ship express"
    - "Contact me after 5pm"
    """
    runtime.store.put(("customers", "cust-42"), key, {"value": value})
    return f"Saved {key}={value}"

@tool
def get_prefs(runtime: ToolRuntime) -> str:
    """
    Retrieve saved customer preferences from Store.
    
    Use when:
    - Starting a new support thread
    - Customer asks "What do you have on file?"
    """
    items = list(runtime.store.search(("customers", "cust-42")))
    if not items:
        return "No preferences saved."
    return ", ".join(f"{i.key}={i.value['value']}" for i in items)

print("Component 3: Long-term memory (Day 2 Section 05)")
print("  • InMemoryStore for customer preferences")
print("  • save_pref / get_prefs tools: persist across threads")
print()

# ════════════════════════════════════════════════════════════════════════════
# COMPONENT 4: Context growth middleware (Day 2 Section 05)
# ════════════════════════════════════════════════════════════════════════════

print("Component 4: Context growth middleware (Day 2 Section 05)")
print("  • SummarizationMiddleware: trim + summarize old messages")
print("  • ContextEditingMiddleware: clear old tool results")
print("  • Production thresholds (low for demo, tune for production)")
print()

# ════════════════════════════════════════════════════════════════════════════
# COMPLETE AGENT: All components wired together
# ════════════════════════════════════════════════════════════════════════════

agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[
        lookup_order,      # Day 1: Structured data
        search_policies,   # Day 2: RAG
        save_pref,         # Day 2: Store (write)
        get_prefs,         # Day 2: Store (read)
    ],
    store=store,
    checkpointer=MemorySaver(),
    system_prompt=(
        "You are an order support agent. "
        "Use lookup_order for ORD-* status (structured data). "
        "Use search_policies for refund/shipping/contact questions (RAG). "
        "Use save_pref to remember customer preferences. "
        "Use get_prefs to recall saved preferences. "
        "Always cite sources when using policy search."
    ),
    middleware=[
        # Context growth strategies (all 5 layers from Day 2)
        SummarizationMiddleware(
            model="groq:openai/gpt-oss-20b",
            trigger=("messages", 10),
            keep=("messages", 4),
        ),
        ContextEditingMiddleware(
            edits=[
                ClearToolUsesEdit(
                    trigger=2500,
                    keep=3,
                    placeholder="[old tool result cleared]",
                )
            ],
        ),
    ],
)

print("═" * 100)
print("AGENT READY: All 4 components integrated")
print("═" * 100)
print()

cfg = {"configurable": {"thread_id": "support-complete-demo"}}

# ════════════════════════════════════════════════════════════════════════════
# DEMO: Complete agent handling diverse requests
# ════════════════════════════════════════════════════════════════════════════

print("DEMO 1: Structured lookup (Day 1)")
r1 = agent.invoke(
    {"messages": [HumanMessage(content="What is the status of ORD-1?")]},
    config=cfg,
)
print(f"  Q: Status of ORD-1?")
print(f"  A: {r1['messages'][-1].content}")
print("-" * 100)

print("DEMO 2: RAG over policies (Day 2)")
r2 = agent.invoke(
    {"messages": [HumanMessage(content="What is the refund window?")]},
    config=cfg,
)
print(f"  Q: What is the refund window?")
print(f"  A: {r2['messages'][-1].content}")
print("-" * 100)

print("DEMO 3: Save preference (Day 2 Store)")
r3 = agent.invoke(
    {"messages": [HumanMessage(content="Save preference contact=email for me.")]},
    config=cfg,
)
print(f"  Q: Save preference contact=email")
print(f"  A: {r3['messages'][-1].content}")
print("-" * 100)

print("DEMO 4: Combined query (structured + RAG + Store)")
r4 = agent.invoke(
    {
        "messages": [
            HumanMessage(
                content="What's my contact preference? Also status of ORD-2 and how many days for refunds?"
            )
        ]
    },
    config=cfg,
)
