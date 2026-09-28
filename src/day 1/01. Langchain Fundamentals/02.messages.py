# 02 — Messages (building conversations)
#
# Concept: A conversation is a list of typed message objects.
#   SystemMessage — instructions for the model (role, behavior)
#   HumanMessage  — user input
#   AIMessage     — model replies (used as history for multi-turn)
#
# Evolution of Chat Interfaces:
#   2020: String concatenation → fragile, no role distinction
#   2022 Q1: Dict messages {"role": "user", "content": "..."} → verbose
#   2022 Q3: Typed message classes introduced → type-safe, clean
#   2023-Present: Message metadata support → tool calls, images, etc.
#   Takeaway: Typed messages make conversations structured and debuggable.
#
# Example: Multi-turn geography tutor with conversation history

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import AIMessage, HumanMessage, SystemMessage

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

# ════════════════════════════════════════════════════════════════════════════
# KEY CODE SNIPPET: Building a multi-turn conversation
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("MULTI-TURN CONVERSATION WITH MESSAGES")
print("═" * 100)
print()

messages = [
    SystemMessage(content="You are a geography tutor. Answer in one short sentence."),
    HumanMessage(content="What is the capital of Germany?"),
    AIMessage(content="The capital of Germany is Berlin."),
    HumanMessage(content="What about France?"),  # Model knows context from history
]

result = model.invoke(messages)

print("Conversation history:")
for m in messages:
    print(f"  {type(m).__name__}: {m.content}")
print()
print(f"Model reply: {result.content}")
print()

print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Conversation history:")
print("  SystemMessage: You are a geography tutor. Answer in one short sentence.")
print("  HumanMessage: What is the capital of Germany?")
print("  AIMessage: The capital of Germany is Berlin.")
print("  HumanMessage: What about France?")
print()
print("Model reply: The capital of France is Paris.")
print()
print("Notice: Model understood 'What about France?' refers to capitals (from history)")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("MESSAGE TYPES:")
print("  • SystemMessage: Instructions, persona, rules")
print("  • HumanMessage: User input")
print("  • AIMessage: Model output (for history)")
print("  • ToolMessage: Tool results (Day 1 Section 02)")
print()
print("CONVERSATION FLOW:")
print("  1. Build message list: [System, Human, AI, Human, ...]")
print("  2. model.invoke(messages) sends full history")
print("  3. Model sees ALL previous turns (context window permitting)")
print("  4. Returns AIMessage with new reply")
print()
print("WHY TYPED MESSAGES:")
print("  ✓ Type-safe (catch errors at code time)")
print("  ✓ Debuggable (inspect message types in logs)")
print("  ✓ Extensible (add metadata, images, tool calls)")
print("-" * 100)
