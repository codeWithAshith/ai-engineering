# 04 — Growth strategies via middleware (complete context management)
#
# Concept: The 5-layer ladder for managing context growth, all wired into one agent:
#
# | Layer | Strategy | When | Middleware |
# |-------|----------|------|------------|
# | 1 | **Trim** | Keep only recent N messages | SummarizationMiddleware keep=N |
# | 2 | **Compact** | Clear old tool dumps | ContextEditingMiddleware + ClearToolUsesEdit |
# | 3 | **Summarize** | Replace old turns with summary | SummarizationMiddleware trigger |
# | 4 | **Store** | Save facts to long-term memory | create_agent(..., store=...) |
# | 5 | **Retrieve** | Pull only what you need | Tools with ToolRuntime.store.search() |
#
# Where this came from:
#   trim_messages, summarization, and "delete old tool output" used to be code you wrote inside the loop.
#   create_agent middleware (LangChain 1.0) is the hook list for that work: trim, summarize, clear tool results.
#   The five names below are the order we use in class, not five products released in five quarters.
#
# Limitation overcome: Day 1 agents grow unbounded (trim by hand each call is fragile).
# This lesson combines ALL 5 strategies into one production-ready order-support agent.
#
# ```mermaid
# flowchart LR
#   msg[messages grow] --> trim[Layer 1: Trim]
#   trim --> compact[Layer 2: Compact]
#   compact --> summ[Layer 3: Summarize]
#   summ --> store[Layer 4: Store facts]
#   store --> retrieve[Layer 5: Retrieve on demand]
#   retrieve --> model[Model sees clean context]
# ```

# ════════════════════════════════════════════════════════════════════════════
# STRATEGY EXPLANATIONS (inline, since we deleted theory files)
# ════════════════════════════════════════════════════════════════════════════

# LAYER 1: TRIM
# -------------
# Drop oldest messages to fit token budget.
# - Fast (no LLM call)
# - Loses detail
# - Best for: recent context more important than old
# - Implementation: SummarizationMiddleware(keep=("messages", N))

# LAYER 2: COMPACT
# ----------------
# Remove old tool results (ToolMessage), keep recent ones.
# - Reduces noise from repeated tool calls
# - Fast (no LLM call)
# - Best for: agents that call tools many times
# - Implementation: ContextEditingMiddleware + ClearToolUsesEdit

# LAYER 3: SUMMARIZE
# ------------------
# Replace old turns with LLM-generated summary.
# - Slow (LLM call)
# - Preserves gist, loses specifics
# - Best for: need context from early conversation
# - Implementation: SummarizationMiddleware(trigger=..., summarize=True)

# LAYER 4: STORE
# --------------
# Save facts to long-term memory (survives thread restart).
# - Permanent storage
# - Must be structured (key/value)
# - Best for: preferences, policies, user profiles
# - Implementation: create_agent(..., store=InMemoryStore())

# LAYER 5: RETRIEVE
# -----------------
# Pull only needed facts from Store (on-demand).
# - Minimal context pollution
# - Requires tool design (when to retrieve?)
# - Best for: large fact databases, selective access
# - Implementation: Tools with ToolRuntime.store.search()

# ════════════════════════════════════════════════════════════════════════════
# PRODUCTION AGENT: All 5 layers wired together
# ════════════════════════════════════════════════════════════════════════════

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import (
    ClearToolUsesEdit,
    ContextEditingMiddleware,
    SummarizationMiddleware,
)
from langchain.messages import HumanMessage
from langchain.tools import ToolRuntime, tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.memory import InMemoryStore

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}
store = InMemoryStore()


@tool
def lookup_order(order_id: str) -> str:
    """Look up order status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


@tool
def save_pref(key: str, value: str, runtime: ToolRuntime) -> str:
    """Save a customer preference (Layer 4: Store)."""
    runtime.store.put(("customers", "cust-42"), key, {"value": value})
    return f"Saved {key}={value}"


@tool
def get_prefs(runtime: ToolRuntime) -> str:
    """Retrieve saved customer preferences (Layer 5: Retrieve)."""
    items = list(runtime.store.search(("customers", "cust-42")))
    if not items:
        return "No preferences saved."
    return ", ".join(f"{i.key}={i.value['value']}" for i in items)


# Production agent with ALL 5 context growth strategies
# Low thresholds for demo (students can see wiring); raise in production
agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[lookup_order, save_pref, get_prefs],
    store=store,  # Layer 4: Store for long-term facts
    checkpointer=MemorySaver(),
    system_prompt=(
        "You are order support. "
        "Use save_pref to remember preferences. "
        "Use get_prefs to recall what's saved. "
        "Use lookup_order for ORD-* status."
    ),
    middleware=[
        # Layer 1+3: Trim recent messages, summarize old ones
        SummarizationMiddleware(
            model="groq:openai/gpt-oss-20b",
            trigger=("messages", 8),  # Summarize when >8 messages
            keep=("messages", 4),  # Keep 4 most recent (Layer 1: Trim)
        ),
        # Layer 2: Compact old tool results
        ContextEditingMiddleware(
            edits=[
                ClearToolUsesEdit(
                    trigger=2000,  # When context hits 2000 tokens
                    keep=2,  # Keep only 2 most recent tool results
                    placeholder="[old tool result cleared]",
                )
            ],
        ),
    ],
)

cfg = {"configurable": {"thread_id": "support-growth"}}

print("═" * 100)
print("PRODUCTION AGENT: All 5 context growth layers active")
print("═" * 100)
print()

print("Turn 1: Save preference (Layer 4: Store)")
r1 = agent.invoke(
    {"messages": [HumanMessage(content="Save preference contact=email.")]},
    config=cfg,
)
print(f"  → {r1['messages'][-1].content}")
print("-" * 100)

print("Turn 2: Retrieve preference + lookup (Layer 5: Retrieve + tool)")
r2 = agent.invoke(
    {
        "messages": [
            HumanMessage(
                content="What contact preference is saved? Also status of ORD-1?"
            )
        ]
    },
    config=cfg,
)
print(f"  → {r2['messages'][-1].content}")
print("-" * 100)

print("Turns 3-6: Generate enough history to trigger middleware...")
for i in range(4):
    r = agent.invoke(
        {
            "messages": [
                HumanMessage(content=f"Follow-up {i}: any update on ORD-1 shipping?")
            ]
        },
        config=cfg,
    )
    print(f"  Turn {i+3}: {r['messages'][-1].content[:80]}...")

print("-" * 100)
print()
