# 04 — Embeddings
#
# An embedding turns tokens into one vector of numbers.
# This toy gives each word three numbers and averages them. Classroom only.
# This course calls nomic-embed-text for the chunks and for the question.
# Same model both times. A different model means build the store again.
# A hosted embedding API is for a corpus that does not stay on this machine.
# The chat model writes the reply. It does not embed.

TOY = {
    "refund": (0.90, 0.10, 0.00),
    "window": (0.80, 0.20, 0.00),
    "shipping": (0.00, 0.20, 0.90),
    "days": (0.10, 0.10, 0.80),
}


def embed(text: str) -> tuple[float, float, float]:
    words = [w for w in text.lower().split() if w in TOY]
    acc = [0.0, 0.0, 0.0]
    for word in words:
        for i, value in enumerate(TOY[word]):
            acc[i] += value
    n = len(words)
    return tuple(round(v / n, 2) for v in acc)


for phrase in ("refund window", "shipping days"):
    print(phrase, "→", embed(phrase))
