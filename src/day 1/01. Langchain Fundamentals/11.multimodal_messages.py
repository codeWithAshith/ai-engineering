# 11 — Multimodal messages
#
# Concept: HumanMessage content can be a list of blocks (text + image),
# not only a plain string — same model.invoke API.
#
# Evolution of Multimodal Support:
#   2022: Images via external OCR services → text-only models
#   2023 Q2: GPT-4 Vision launch → proprietary OpenAI feature
#   2023 Q4: Anthropic Claude 3, Gemini added vision → multiple providers
#   2024–Present: Universal multimodal support via HumanMessage content blocks
#   Takeaway: Vision is now standard across all major models.
#
# Example: geography tutor message that includes image + text blocks.

import base64
from pathlib import Path

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

load_dotenv()

model = init_chat_model(model="groq:openai/gpt-oss-20b")

# ────────────────────────────────────────────────────────────────────────────
# Example 1: Placeholder image (for lesson structure demo)
# ────────────────────────────────────────────────────────────────────────────

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

print("Example 1: Placeholder image + text blocks")
print("message blocks:", [b.get("type") for b in messages[1].content])
print("-" * 100)
try:
    print("model.invoke →", model.invoke(messages).content)
except Exception as e:
    print(f"Provider/vision note: {type(e).__name__}: {e}")
    print("Shape still valid — swap in a vision-capable model for production.")
print("-" * 100)

# ────────────────────────────────────────────────────────────────────────────
# Example 2: Real use case — screenshot with order details
# ────────────────────────────────────────────────────────────────────────────

print("Example 2: Real vision use case (screenshot analysis)")
print()
print("Customer support workflow:")
print("  1. Customer uploads screenshot of order confirmation")
print("  2. Agent extracts order ID from image")
print("  3. Agent looks up status and responds")
print()
print("Message structure:")

screenshot_message = [
    SystemMessage(content="You are order support. Extract order IDs from screenshots."),
    HumanMessage(
        content=[
            {
                "type": "text",
                "text": "Please extract the order ID from this screenshot. Reply with ONLY the order ID (e.g., ORD-123)."
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": data_url,  # In production: actual screenshot base64 or URL
                    "detail": "high"  # Optional: 'low' for speed, 'high' for accuracy
                }
            },
        ]
    ),
]

print("  - Text block: extraction instruction")
print("  - Image block: screenshot with detail='high' for OCR")
print()
print("In production:")
print("  ✓ Customer uploads via web form → base64 encode")
print("  ✓ Agent extracts order ID → calls lookup_order(order_id)")
print("  ✓ Agent responds with status → no human needed")
print("-" * 100)

print("Other real-world vision use cases:")
print("  • Receipt scanning → extract line items + total")
print("  • Diagram analysis → extract architecture components")
print("  • Chart reading → convert graph to data points")
print("  • Handwriting OCR → parse customer notes")
print("  • Product photos → identify item for support ticket")
print("-" * 100)

print("MULTIMODAL MESSAGE STRUCTURE:")
print("  HumanMessage(content=STRING) → text-only (all previous lessons)")
print("  HumanMessage(content=LIST) → blocks with types:")
print("    {'type': 'text', 'text': '...'}")
print("    {'type': 'image_url', 'image_url': {'url': 'data:...', 'detail': 'high'}}")
print()
print("  Same .invoke() API, just different content shape!")
print("-" * 100)
