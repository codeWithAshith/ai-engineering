# 01 — Chat models
#
# Concept: a chat model is the LLM API object you call.
#   init_chat_model(...) builds it
#   model.invoke(messages) sends messages and returns an AIMessage
#
# Example: geography tutor answering "What is the capital of …?"

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

result = model.invoke(
    [
        SystemMessage(content="You are a geography tutor. Answer in one short sentence."),
        HumanMessage(content="What is the capital of France?"),
    ]
)

print(type(result).__name__)  # AIMessage
print(result.content)
print("-" * 100)
