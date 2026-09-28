# 05 — Database tools (SQL with safety)
#
# Concept: Tools can run SQL. Use placeholders (?) — never format user text into SQL.
# Mark READ vs WRITE the same way as order tools (lesson 03).
#
# Evolution of SQL Tools:
#   2022: String interpolation f"SELECT * FROM products WHERE name='{user_input}'" → SQL injection!
#   2023 Q1: Parameterized queries → safer but manual everywhere
#   2023 Q3: @tool + SQL placeholders → standard pattern
#   2024-Present: SQL tool governance → read-only by default (Day 2 Section 04)
#   Takeaway: ALWAYS use placeholders (?). Never f-strings with user input.
#
# Example: Order-support catalog — search products (READ), update stock (WRITE)
#
# ```mermaid
# flowchart TD
#   agent -->|search| read[READ: search_products - SELECT]
#   agent -->|update| write[WRITE: update_stock - UPDATE]
#   read --> sqlite[(SQLite products)]
#   write --> sqlite
#   sqlite --> read
#   sqlite --> write
# ```

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


@tool
def search_products(keyword: str) -> str:
    """READ: Search products by name. SQL uses ? placeholder for safety."""
    rows = conn.execute(
        "SELECT name, price, stock FROM products WHERE name LIKE ?", (f"%{keyword}%",)
    ).fetchall()
    if not rows:
        return f"No products found matching '{keyword}'"
    return "\n".join(f"{r['name']}: ${r['price']}, stock {r['stock']}" for r in rows)


@tool
def update_stock(product_name: str, new_stock: int) -> str:
    """WRITE: Update product stock. Only use when customer confirms."""
    conn.execute(
        "UPDATE products SET stock = ? WHERE name = ?", (new_stock, product_name)
    )
    return f"Updated {product_name} stock to {new_stock}"


agent = create_agent(
    model="groq:openai/gpt-oss-20b",
    tools=[search_products, update_stock],
    system_prompt="You are catalog support. READ tools freely. WRITE tools need confirmation.",
)

print("═" * 100)
print("READ: Search products")
print("═" * 100)
r1 = agent.invoke({"messages": [HumanMessage(content="Do you have keyboards?")]})
print(f"Q: Do you have keyboards?")
print(f"A: {r1['messages'][-1].content}")
print()
print("EXAMPLE OUTPUT: Yes, we have Keyboard in stock: $49.99, 12 units available.")
print()
print("SQL executed: SELECT name, price, stock FROM products WHERE name LIKE '%keyboard%'")
print("Safety: Used ? placeholder, not f-string!")
print("-" * 100)

print()
print("═" * 100)
print("WRITE: Update stock")
print("═" * 100)
r2 = agent.invoke({"messages": [HumanMessage(content="Set keyboard stock to 20.")]})
print(f"Q: Set keyboard stock to 20.")
print(f"A: {r2['messages'][-1].content}")
print()
print("EXAMPLE OUTPUT: I've updated the Keyboard stock to 20 units.")
print()
print("SQL executed: UPDATE products SET stock = ? WHERE name = ?")
print("Parameters: (20, 'Keyboard')")
print("-" * 100)
