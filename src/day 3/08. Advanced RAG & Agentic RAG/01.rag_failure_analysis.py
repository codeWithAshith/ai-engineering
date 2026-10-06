# 01 — RAG evaluation metrics (start here)
#
# Day 2 built plain RAG: retrieve → stuff context → answer.
# Day 3 starts by measuring that path. Same e-commerce ticket for every metric.
#
# ---------------------------------------------------------------------------
# 0) ANCHORING SCENARIO (keep this ticket in mind for every section below)
# ---------------------------------------------------------------------------
#
#   User query:     "How long do I have to return a product?"
#   Ground truth:   "You can return a product within 30 days."
#   LLM output:     "You can return a product within 70 days of purchase if unused..."
#
#   Retrieved pool (Top-5) — labels reused below:
#     #1  30-day return policy             ← RELEVANT (R1)
#     #2  3–5 day shipping ETA             ← noise
#     #3  1-year warranty                  ← noise
#     #4  70-day technical support         ← noise (says "days", wrong topic)
#     #5  unused / original packaging      ← RELEVANT (R2)
#
#   Also needed but NOT in this pool (for recall):
#     R3  "returns start from delivery date"  ← RELEVANT, MISSING
#
#   Sections 2–3 will re-order or complete this set on purpose so you can
#   see order (precision) vs coverage (recall) move independently.
#
#   Pattern for every metric below:
#     1. one-line question the metric answers
#     2. a small table of numbers
#     3. the formula + plug-in arithmetic
#     4. what changes if order / coverage / answer text changes
#     5. which Day 3 lesson fixes a low score
#
# ---------------------------------------------------------------------------
# 1) CLASSICAL PRECISION vs RECALL (50-email spam box)
# ---------------------------------------------------------------------------
# Question: of what we flagged / of what was truly spam — how good were we?
#
# Inbox truth:
#   50 emails total = 25 spam + 25 legitimate
#
# Predictions (spam box):
#   True Positive  (TP)  20  spam correctly sent to spam
#   False Positive (FP)  15  legitimate mail wrongly sent to spam (job offer, visa)
#   False Negative (FN)   5  spam that leaked into inbox ("You won 1 Lakh!")
#   (True Negatives exist but precision/recall for "spam" do not use them)
#
#   |                | Predicted spam | Predicted not-spam |
#   |----------------|----------------|--------------------|
#   | Actually spam  | TP = 20        | FN = 5             |
#   | Actually legit | FP = 15        | TN = 10            |
#
# Precision = TP / (TP + FP) = 20 / (20 + 15) = 20/35 ≈ 0.57
#   → "Of everything we put in the spam box, how much was really spam?"
#
# Recall    = TP / (TP + FN) = 20 / (20 + 5)  = 20/25 = 0.80
#   → "Of all real spam, how much did we catch?"
#
# What changes:
#   More FP (good mail in spam) → precision ↓, recall unchanged
#   More FN (spam in inbox)     → recall ↓, precision unchanged
#
# Bridge to RAG: "spam" ≈ "relevant chunk", "spam box" ≈ "retrieved Top-K".
#
# ---------------------------------------------------------------------------
# 2) CONTEXT PRECISION (rank-aware — chunk ORDER matters)
# ---------------------------------------------------------------------------
# Question: of the chunks we retrieved, how useful are they — especially near
#           the top, where the LLM pays the most attention?
#
# Formula (RAGAS-style average of Precision@k at each relevant rank k):
#
#   For each rank k where chunk_k is RELEVANT:
#     Precision@k = (# relevant chunks in positions 1..k) / k
#   Context Precision = average of those Precision@k values
#                     = (Σ Precision@k for relevant k) / (# relevant in retrieved)
#
# Irrelevant ranks contribute 0 to the numerator sum (they never open a @k term).
#
# --- Scenario A: good ranking (relevant on top) ---
#   Rank  Chunk                         Relevant?
#   1     30-day return                 YES
#   2     unused / packaging            YES
#   3     return window from delivery   YES
#   4     shipping ETA                  NO
#   5     warranty                      NO
#
#   Relevant ranks = {1, 2, 3}  → three Precision@k terms:
#     P@1 = 1/1 = 1.00
#     P@2 = 2/2 = 1.00
#     P@3 = 3/3 = 1.00
#   Context Precision = (1.00 + 1.00 + 1.00) / 3 = 1.00  (100%)
#
# --- Scenario B: SAME chunks, ORDER swapped (relevant buried) ---
# Swap so relevant land at ranks 2, 3, 5 (rank 1 is now noise):
#
#   Rank  Chunk                         Relevant?
#   1     shipping ETA                  NO
#   2     30-day return                 YES
#   3     unused / packaging            YES
#   4     warranty                      NO
#   5     return window from delivery   YES
#
#   Relevant ranks = {2, 3, 5}:
#     P@2 = 1/2 = 0.50     (only 1 relevant in top-2)
#     P@3 = 2/3 ≈ 0.67
#     P@5 = 3/5 = 0.60
#   Context Precision = (0.50 + 0.67 + 0.60) / 3 ≈ 0.59  (~59%)
#
# What changes when chunk ORDER changes:
#   Same set of chunks → classical "relevant/retrieved" stays flat,
#   but Context Precision DROPS when relevant items move down.
#   That is why Top-1 / Top-3 quality matters more than "we got it somewhere
#   in Top-20".
#
# Common mix-up:
#   Naive precision = (# relevant retrieved) / (# retrieved)
#     Scenario A and B both have 3/5 = 0.60 — order-blind.
#   Context Precision above is order-aware — prefer it for RAG.
#
# Low score → 05 rerank / 06 metadata filter / smaller Top-K (11).
#
# ---------------------------------------------------------------------------
# 3) CONTEXT RECALL (did we fetch what we NEEDED?)
# ---------------------------------------------------------------------------
# Question: of all relevant facts that exist for this query, what fraction
#           made it into the retrieved context?
#
# Formula (IR / RAG ground-truth recall):
#   Context Recall = |relevant chunks retrieved| / |all relevant chunks needed|
#
# NOT "relevant / retrieved" — that ratio is precision-shaped.
#
# Table for our return ticket:
#   Needed relevant set (ground truth coverage) = 3 pieces
#     R1  30-day return policy
#     R2  unused / original packaging
#     R3  returns start from delivery date
#
#   Retrieved relevant = {R1, R2}     (R3 missing)
#   Retrieved noise    = shipping, warranty, 70-day support
#
#   Context Recall = 2 / 3 ≈ 0.67  (67%)
#
#   If we only report "3 relevant out of 5 retrieved = 60%", that number is
#   closer to naive precision of the pool — do not call it recall.
#
# What changes:
#   Retrieve R3 as well              → recall 3/3 = 1.00; precision may still be low
#   Miss R1 and R2                   → recall ↓ even if Top-K is full of noise
#   Raise Top-K / better chunking    → often lifts recall (more chance to catch R3)
#   Raise Top-K without filtering    → can hurt precision (more noise on the pile)
#
# Low score → 03 BM25 / 04 hybrid / 07 rewrite / 08 multi-query /
#             11 Top-K or parent-child / 09 decompose (multi-part tickets).
#
# ---------------------------------------------------------------------------
# 4) RESPONSE / ANSWER RELEVANCY (does the reply address THIS query?)
# ---------------------------------------------------------------------------
# Question: is the final answer on-topic for the user, or did it drift?
#
# Method (reverse query generation — LLM-as-judge style):
#   1. Take the LLM response only (hide the user query from this step).
#   2. Ask a judge LLM: "write 3 questions this answer could be answering."
#   3. Embed each synthetic question + the real user query.
#   4. Cosine-similarity(real query, synthetic_i) for i = 1..3
#   5. Answer Relevancy = average of those 3 similarities
#
# Example (numbers for classroom arithmetic):
#   Real query: "How long do I have to return a product?"
#   Answer drifts into warranty + shipping fluff.
#
#   Synthetic Q1 (about return window)     sim = 0.92
#   Synthetic Q2 (about warranty length)   sim = 0.41
#   Synthetic Q3 (about shipping ETA)      sim = 0.38
#   Answer Relevancy = (0.92 + 0.41 + 0.38) / 3 ≈ 0.57  (57%)
#
#   Tight on-topic answer → synthetic questions stay near the real query → score ↑
#
# What changes:
#   Off-topic sentences in the answer → reverse questions diverge → relevancy ↓
#   Answer that ignores the ask       → low score even if faithful to context
#   Noisy retrieved context in prompt → model more likely to drift
#
# Low score → tighten system prompt / 10 compress / 06 filter / 13 skip chitchat RAG.
#
# ---------------------------------------------------------------------------
# 5) FAITHFULNESS (atomic claim verification — hallucination check)
# ---------------------------------------------------------------------------
# Question: does every claim in the answer stick to the retrieved context
#           (no invention, no contradiction)?
#
# Method:
#   1. Split the LLM answer into atomic claims (one fact each).
#   2. For each claim, check: supported by retrieved context? YES / NO
#   3. Faithfulness = (# supported claims) / (# total claims)
#
# Example — answer: "Return within 70 days if unused; email support for a label."
# against context that only supports 30-day returns + unused condition:
#
#   | # | Atomic claim                              | In context? | Verdict   |
#   |---|-------------------------------------------|-------------|-----------|
#   | 1 | Return within 70 days                     | NO (says 30)| FAIL      |
#   | 2 | Item must be unused / original packaging  | YES         | PASS      |
#   | 3 | Contact support for a return label        | YES         | PASS      |
#
#   Faithfulness = 2 / 3 ≈ 0.67  (67%)
#
# What changes:
#   Invent "70 days" or "restocking fee" not in context → faithfulness ↓
#   Paraphrase of a supported sentence                 → still PASS
#   Correct world knowledge that was NEVER retrieved   → FAIL for this metric
#     (faithfulness is groundedness to CONTEXT, not to external truth)
#
# Low score → 10 compress + grounded prompt ("answer only from context") /
#             better precision so the prompt is not full of confusing noise.
#
# ---------------------------------------------------------------------------
# 6) HOW THE FOUR RAG METRICS FIT TOGETHER
# ---------------------------------------------------------------------------
#
#   Retrieval quality          Generation quality
#   ------------------------   ----------------------------
#   Context Recall             Faithfulness   (stick to context)
#   Context Precision          Answer Relevancy (stick to the question)
#
#   High recall + low precision  → right docs somewhere, buried in noise
#   High precision + low recall  → clean top ranks, missing a needed fact
#   High both + low faithfulness → retrieve OK, prompt/model invents
#   High faithfulness + low relevancy → true to context, wrong question
#
# ---------------------------------------------------------------------------
# 7) FAILURE → WHAT IT LOOKS LIKE → OPEN THIS LESSON NEXT
# ---------------------------------------------------------------------------
# Low CONTEXT RECALL / RETRIEVAL_MISS
#   Empty or wrong files; invents or "I don't know"
#   → 03 BM25 / 04 hybrid (exact tokens)
#   → 07 rewrite / 08 multi-query
#   → 11 Top-K or parent-child chunking
#
# Low CONTEXT PRECISION
#   Right neighborhood, wrong order / noise on top; best chunk is #3
#   → 05 rerank / 06 metadata filter / smaller Top-K (11)
#
# INCOMPLETE (multi-part ticket, only one source)  — recall hole on part B
#   Need refund timing AND email; only one file comes back
#   → 09 decompose / 12 iterative / 14 multi-source
#   → do not over-filter with 06 when both desks are needed
#
# CONTEXT_BLOAT / low FAITHFULNESS or ANSWER RELEVANCY
#   Prompt too long; invents portals/fees; answers the wrong ask
#   → 10 compress + grounded prompt
#   → 13 agent-driven (skip search on chitchat)
#
# 02–04 teach how search works (dense / sparse / hybrid).
# 05–14 are the fixes named above.
# 15–18 are placeholders (HyDE, CRAG/Self-RAG, adaptive router, GraphRAG).
