# 01 — Tool calling
#
# Same tool. Two ways to run it. Give both equal weight.
#
#   1) bind_tools
#      The model does not run Python. invoke returns a tool call
#      (name + arguments). An executor has to run that call, send the
#      result back, and decide whether to call the model again.
#      In this file you are the executor, for one round.
#      The old class that hid this loop was AgentExecutor.
#
#   2) create_agent
#      This is the executor. It binds the tools, calls the model,
#      runs every tool call, and repeats until the model stops asking.
#      The system prompt stays on every turn.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, ToolMessage
from langchain.tools import tool

load_dotenv()

ORDERS = {"ORD-1": "shipped", "ORD-2": "pending"}


@tool
def lookup_order(order_id: str) -> str:
    """Look up one order's status by id."""
    return ORDERS.get(order_id, f"Order {order_id} not found")


model = init_chat_model(model="groq:openai/gpt-oss-20b")
tools = [lookup_order]
question = [HumanMessage(content="What is the status of ORD-1?")]

# Way 1 — bind_tools. The model returns a tool call. You execute it.
# There is no loop here. A second tool call means you write the executor.
model_with_tools = model.bind_tools(tools)
ai = model_with_tools.invoke(question)
call = ai.tool_calls[0]
result = lookup_order.invoke(call["args"])
tool_message = ToolMessage(content=result, tool_call_id=call["id"], name=call["name"])
final = model_with_tools.invoke(question + [ai, tool_message])
print("bind_tools:", final.content)

# Way 2 — create_agent is the executor. It loops until the model is done.
agent = create_agent(model, tools=tools, system_prompt="You are order support. Use lookup_order for status questions.")
answer = agent.invoke({"messages": question})
print("create_agent:", answer["messages"][-1].content)
