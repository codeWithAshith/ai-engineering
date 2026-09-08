# 05 — Database tools
#
# Concept: tools can run SQL. Use placeholders (?) — never format user text into SQL.
# Mark READ vs WRITE the same way as order tools.
#
# Example: order-support catalog — search products, update stock in SQLite.

import sqlite3

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool

load_dotenv()

conn = sqlite3.connect(":memory:", check_same_thread=False)
conn.row_factory = sqlite3.Row
conn.execute(
    "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL, stock INTEGER)"
)
conn.executemany(
    "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
    [
        ("Keyboard", 49.99, 12),
        ("Mouse", 19.99, 30),
        ("Monitor", 199.99, 5),
    ],
)
conn.commit()


@tool
def search_products(name_query: str) -> str:
    """READ: Search products by name substring for support lookups."""
    rows = conn.execute(
        "SELECT id, name, price, stock FROM products WHERE name LIKE ?",
        (f"%{name_query}%",),
    ).fetchall()
    if not rows:
        return "No products found"
    return "\n".join(
        f"{r['id']}: {r['name']} ${r['price']} (stock {r['stock']})" for r in rows
    )


@tool
def update_stock(product_id: int, new_stock: int) -> str:
    """WRITE: Update stock for a product id. Only when the user asks to change inventory."""
    cur = conn.execute(
        "UPDATE products SET stock = ? WHERE id = ?",
        (new_stock, product_id),
    )
    conn.commit()
    if cur.rowcount == 0:
        return f"No product with id {product_id}"
    return f"Updated product {product_id} stock to {new_stock}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[search_products, update_stock],
    system_prompt=(
        "You are order support with a product catalog. "
        "Use search_products to find items. "
        "Use update_stock only when asked to change inventory."
    ),
)

for question in [
    "Find products with Mouse in the name",
    "Set stock of product id 1 to 20",
]:
    result = agent.invoke({"messages": [HumanMessage(content=question)]})
    tools_used = [
        c["name"]
        for m in result["messages"]
        if getattr(m, "tool_calls", None)
        for c in m.tool_calls
    ]
    print(f"Q: {question}")
    print(f"  tools: {tools_used}")
    print(f"  answer: {result['messages'][-1].content}")
    print("-" * 100)
