# 10 — Production backends (Postgres store, Postgres checkpointer, summarization)
#
# Concept: same APIs as InMemory / MemorySaver / SummarizationMiddleware,
# swapped for production. Order-support prefs + threads still use the same shapes.
#
# --- A) PostgresStore (long-term memory) ---
# Same put/search API as InMemoryStore (lessons 04–05 / 09).
# Survives process restart; needs Postgres + pgvector.
#
# from langgraph.store.postgres import PostgresStore
# with PostgresStore.from_conn_string(POSTGRES_URI) as store:
#     store.setup()
#     store.put(("customers", "cust-42"), "contact", {"value": "email"})
#
# --- B) Postgres checkpointer (durable threads) ---
# Same compile(checkpointer=...) as Day 1 MemorySaver / SqliteSaver.
# Shared across processes for ORD-* thread_id.
#
# from langgraph.checkpoint.postgres import PostgresSaver
# with PostgresSaver.from_conn_string(DATABASE_URL) as checkpointer:
#     checkpointer.setup()
#     app = graph.compile(checkpointer=checkpointer)
#     app.invoke(inputs, config={"configurable": {"thread_id": "support-1"}})
#
# --- C) SummarizationMiddleware (already runnable in lesson 09) ---
# Auto-summarize older turns inside create_agent — production just raises triggers.
#
# from langchain.agents.middleware import SummarizationMiddleware
# middleware=[
#     SummarizationMiddleware(
#         model="groq:openai/gpt-oss-20b",
#         trigger=("tokens", 4000),
#         keep=("messages", 20),
#     ),
# ]
#
# Requires: uv sync --extra store  (and real DATABASE_URL / POSTGRES_URI) for A/B.
