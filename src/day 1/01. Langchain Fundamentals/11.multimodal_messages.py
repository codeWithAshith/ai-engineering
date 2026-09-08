# 11 — Multimodal messages
#
# Concept: HumanMessage content can be a list of blocks (text + image),
# not only a plain string — same model.invoke API.
#
# Example: geography tutor message that includes a tiny image block.

import base64
from pathlib import Path

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

# Tiny 1x1 PNG (placeholder image bytes for the lesson)
PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)
img_path = Path(__file__).parent / "_demo_pixel.png"
img_path.write_bytes(PNG_BYTES)
data_url = "data:image/png;base64," + base64.b64encode(PNG_BYTES).decode()

messages = [
    SystemMessage(content="You are a geography tutor. Be brief."),
    HumanMessage(
        content=[
            {"type": "text", "text": "This image is a tiny placeholder. Name one European capital."},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]
    ),
]

print("message blocks:", [b.get("type") for b in messages[1].content])
print("-" * 100)
try:
    print("model.invoke →", model.invoke(messages).content)
except Exception as e:
    print(f"Provider/vision note: {type(e).__name__}: {e}")
    print("Shape still valid — swap in a vision-capable model for production.")
print("-" * 100)
