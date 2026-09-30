# 08 — Production backends
#
# Same calls as the in-memory versions. Needs Postgres and `uv sync --extra store`.
#
# from langgraph.store.postgres import PostgresStore
# with PostgresStore.from_conn_string(POSTGRES_URI) as store:
#     store.setup()
#     store.put(("customers", "cust-42"), "contact", {"value": "email"})
#
# from langgraph.checkpoint.postgres import PostgresSaver
# with PostgresSaver.from_conn_string(DATABASE_URL) as checkpointer:
#     checkpointer.setup()
#     app = graph.compile(checkpointer=checkpointer)
