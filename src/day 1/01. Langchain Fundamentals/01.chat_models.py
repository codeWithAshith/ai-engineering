# 01 — Chat models (LLM API basics)
#
# Concept: A chat model is the LLM API object you invoke.
#   init_chat_model(...) builds it with model ID
#   model.invoke(messages) sends messages and returns an AIMessage
#
# Evolution of LLM APIs:
#   2020: Direct API calls → verbose, no abstraction
#   2022 Q1: Wrapper classes per provider → hard to switch
#   2022 Q3: init_chat_model introduced → unified interface
#   2023-Present: 50+ models, one interface → "gro

q:model", "openai:model"
#   Takeaway: init_chat_model abstracts provider differences
#
# Example: geography tutor answering capital questions

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

# ════════════════════════════════════════════════════════════════════════════
# KEY CODE SNIPPET: Initialize and invoke a chat model
# ════════════════════════════════════════════════════════════════════════════

print("═" * 100)
print("CHAT MODEL BASICS")
print("═" * 100)
print()

# Initialize model with provider:model format
model = init_chat_model(model="groq:openai/gpt-oss-20b")

# Invoke with list of messages
result = model.invoke(
    [
        SystemMessage(content="You are a geography tutor. Answer in one short sentence."),
        HumanMessage(content="What is the capital of France?"),
    ]
)

print(f"Model: groq:openai/gpt-oss-20b")
print(f"Result type: {type(result).__name__}")
print(f"Content: {result.content}")
print()

print("═" * 100)
print("EXAMPLE OUTPUT:")
print("═" * 100)
print("Model: groq:openai/gpt-oss-20b")
print("Result type: AIMessage")
print("Content: The capital of France is Paris.")
print("-" * 100)

# ════════════════════════════════════════════════════════════════════════════
# KEY CONCEPTS
# ════════════════════════════════════════════════════════════════════════════

print()
print("═" * 100)
print("KEY CONCEPTS")
print("═" * 100)
print()
print("CHAT MODELS:")
print("  • Central abstraction: model = init_chat_model(provider:model_id)")
print("  • Invoke with messages: [SystemMessage, HumanMessage, ...]")
print("  • Returns AIMessage with .content field")
print()
print("SUPPORTED PROVIDERS:")
print("  • groq:openai/gpt-oss-20b (fast, free tier)")
print("  • openai:gpt-4")
print("  • anthropic:claude-3-5-sonnet-20241022")
print("  • Any model in LangChain registry")
print()
print("WHY THIS MATTERS:")
print("  ✓ Switch models by changing one string")
print("  ✓ No provider-specific code")
print("  ✓ Same interface for 50+ models")
print("-" * 100)
