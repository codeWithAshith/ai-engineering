# 12 — create_agent (without tools)
#
# Concept: create_agent builds a small agent graph around a model.
# It calls the model (and tools, when present) in a loop until it can stop.
# LangChain introduced it so you get one standard entry point instead of
# hand-wiring model ↔ tools ↔ state every time.
#
# Config (what / why):
#
# | Config              | What it is                                      | Why LangChain added it                          |
# |---------------------|-------------------------------------------------|-------------------------------------------------|
# | model               | Chat model string or instance                   | The brain of the agent                          |
# | tools               | Optional list of @tool / callables              | Let the model take actions / read data          |
# | system_prompt       | str or SystemMessage                            | Fixed instructions without rebuilding messages  |
# | middleware          | Hooks around model/tool calls                   | Cross-cutting control (limits, errors, HITL)    |
# | response_format     | Structured-output schema / strategy             | Typed final answers, not only free text         |
# | state_schema        | Extra fields on agent state (TypedDict)         | Carry app data beyond messages                  |
# | context_schema      | Schema for runtime context                      | Pass per-run context (user/role) safely         |
# | checkpointer        | Persist state per thread_id                     | Multi-turn memory / resume                      |
# | store               | Cross-thread long-term memory                   | Preferences shared across conversations         |
# | interrupt_before    | Pause before named nodes                        | Human approval before an action                 |
# | interrupt_after     | Pause after named nodes                         | Inspect / edit after a step                     |
# | debug               | Verbose graph execution logs                    | See node transitions while learning/debugging   |
# | name                | Name of the compiled graph                      | Clear id when nesting agents as subgraphs       |
# | cache               | Optional BaseCache                              | Cache repeated model work                       |
# | transformers        | Optional message/payload transformers           | Advanced reshape of what the model sees         |
#
# This lesson only uses model + system_prompt (+ checkpointer for multi-turn).
# tools=[] / omitted → chat-only agent (no tool loop).
#
# Example: geography tutor — one-shot and multi-turn, still no tools.

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver

load_dotenv()

# --- Example 1: one-shot tutor (replaces model.invoke + SystemMessage) ---
tutor = create_agent(
    model="groq:openai/gpt-oss-20b",
    system_prompt="You are a geography tutor. Answer in one short sentence.",
)

r1 = tutor.invoke(
    {"messages": [HumanMessage(content="What is the capital of France?")]}
)
print("1) one-shot:", r1["messages"][-1].content)
print("-" * 100)

# --- Example 2: second question, still no tools ---
r2 = tutor.invoke(
    {"messages": [HumanMessage(content="What is the capital of Italy?")]}
)
print("2) another country:", r2["messages"][-1].content)
print("-" * 100)

# --- Example 3: multi-turn on one thread (remembers prior messages) ---
tutor_memory = create_agent(
    model="groq:openai/gpt-oss-20b",
    system_prompt="You are a geography tutor. Be brief. Remember the chat.",
    checkpointer=MemorySaver(),
)
thread = {"configurable": {"thread_id": "geo-1"}}
tutor_memory.invoke(
    {"messages": [HumanMessage(content="I am studying France.")]},
    config=thread,
)
r3 = tutor_memory.invoke(
    {"messages": [HumanMessage(content="What capital should I memorize for that country?")]},
    config=thread,
)
print("3) multi-turn:", r3["messages"][-1].content)
print("-" * 100)
