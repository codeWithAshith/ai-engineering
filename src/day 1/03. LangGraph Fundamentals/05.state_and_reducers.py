# 05 — State and reducers
#
# Concept: nodes return partial updates; reducers decide how fields merge.
#   plain field                  → last write wins (overwrite)
#   Annotated[..., add]          → sum ints / concatenate lists
#   Annotated[..., add_messages] → append chat messages
#
# Annotated[T, reducer]:
#   typing.Annotated attaches extra metadata to a type.
#   Here T is the field's value type; the second argument is the reducer LangGraph
#   calls when merging updates: new_value = reducer(old_value, update).
#   Without Annotated, LangGraph just overwrites: new_value = update.
#   Examples:
#     Annotated[int, add]           → operator.add: 0+1 then 1+1 → 2
#     Annotated[list[str], add]     → list concat: ["a"] + ["b"] → ["a","b"]
#     Annotated[list, add_messages] → LangGraph helper that appends chat messages
#
# Limitation overcome: with plain fields, enrich's events=["enriched"] would
# replace normalize's events=["normalized"] — the audit trail is lost.
# Reducers let each ticket step contribute without wiping earlier updates.
#
# Example: same ticket path normalize → enrich for ORD-1, plus touch_count /
# events / messages that accumulate across both nodes.
# Still limited: the path is scripted — the model cannot call tools in a loop.
#
# ```mermaid
# flowchart LR
#   START --> normalize
#   normalize --> enrich
#   enrich --> END
# ```

from operator import add
from typing import Annotated, TypedDict

from langchain.messages import AIMessage, HumanMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


class TicketState(TypedDict):
    # plain types → overwrite (last node wins)
    order_id: str
    status: str
    note: str
    # Annotated[type, reducer] → merge with reducer(old, new)
    touch_count: Annotated[int, add]  # add(old, new) — sum
    events: Annotated[list[str], add]  # add(old, new) — list concat
    messages: Annotated[list, add_messages]  # append messages (not raw list +)


def normalize(state: TicketState) -> dict:
    oid = state["order_id"].strip().upper()
    return {
        "order_id": oid,
        "touch_count": 1,
        "events": ["normalized"],
        "messages": [HumanMessage(content=f"Need help with {oid}")],
    }


def enrich(state: TicketState) -> dict:
    status = ORDERS.get(state["order_id"], "not found")
    note = f"{state['order_id']} is currently {status}"
    return {
        "status": status,
        "note": note,
        "touch_count": 1,
        "events": ["enriched"],
        "messages": [AIMessage(content=note)],
    }


builder = StateGraph(TicketState)
builder.add_node("normalize", normalize)
builder.add_node("enrich", enrich)
builder.add_edge(START, "normalize")
builder.add_edge("normalize", "enrich")
builder.add_edge("enrich", END)
app = builder.compile()


print(app.get_graph().draw_mermaid())
print("-" * 100)
final = app.invoke(
    {
        "order_id": " ord-1 ",
        "status": "",
        "note": "",
        "touch_count": 0,
        "events": [],
        "messages": [],
    }
)
print("order_id (overwrite):", final["order_id"])
print("status / note:       ", final["status"], "|", final["note"])
print("touch_count (sum):   ", final["touch_count"])  # 0+1+1 → 2
print("events (concat):     ", final["events"])  # both steps kept
print("messages (add_messages):", [m.content for m in final["messages"]])
print("-" * 100)
