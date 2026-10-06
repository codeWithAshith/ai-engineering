function MiniTable({ headers, rows }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-[0.95rem]">
        <thead className="border-b border-line bg-paper">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-top text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ kicker, title, children }) {
  return (
    <section className="mb-8 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6">
      <p className="m-0 font-sans text-[11px] font-bold uppercase tracking-wider text-blue-600">{kicker}</p>
      <h3 className="mt-1 mb-3 font-sans text-[1.2rem] font-bold tracking-tight text-slate-900">{title}</h3>
      <div className="font-serif text-[1.02rem] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function Callout({ children, tone = "blue" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    teal: "border-teal-200 bg-teal-50 text-teal-900",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    slate: "border-line bg-paper text-slate-800",
  };
  return <p className={`m-0 rounded-xl border px-3.5 py-2.5 ${tones[tone]}`}>{children}</p>;
}

/**
 * Course-site rendering of 01.rag_failure_analysis.py comments (tables only).
 */
export function RagMetricsLab() {
  return (
    <div className="mb-6">
      <Section kicker="0 · Anchor" title="One ticket for every metric">
        <p className="m-0 mb-3">
          Day 2 built plain RAG: retrieve → stuff context → answer. Day 3 starts by measuring that path.
        </p>
        <MiniTable
          headers={["Piece", "Value"]}
          rows={[
            ["User query", "How long do I have to return a product?"],
            ["Ground truth", "You can return a product within 30 days."],
            ["LLM output (weak)", "You can return a product within 70 days of purchase if unused…"],
          ]}
        />
        <p className="mb-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-500">Retrieved pool (Top-5)</p>
        <MiniTable
          headers={["#", "Chunk", "Label"]}
          rows={[
            ["1", "30-day return policy", "RELEVANT (R1)"],
            ["2", "3–5 day shipping ETA", "noise"],
            ["3", "1-year warranty", "noise"],
            ["4", "70-day technical support", "noise (says “days”, wrong topic)"],
            ["5", "unused / original packaging", "RELEVANT (R2)"],
          ]}
        />
        <Callout tone="slate">
          Also needed but <strong>not</strong> in this pool: R3 “returns start from delivery date” — RELEVANT, MISSING.
          Sections below re-order or complete this set so order (precision) and coverage (recall) move independently.
        </Callout>
        <p className="mt-3 mb-0 text-slate-600">
          Pattern for every metric: (1) question it answers → (2) table → (3) formula → (4) what changes → (5) which lesson fixes a low score.
        </p>
      </Section>

      <Section kicker="1 · Classical IR" title="Spam box → precision and recall">
        <p className="m-0 mb-3">
          Question: of what we flagged / of what was truly spam — how good were we?
        </p>
        <p className="m-0 mb-2 text-slate-600">Inbox: 50 emails = 25 spam + 25 legitimate.</p>
        <MiniTable
          headers={["", "Predicted spam", "Predicted not-spam"]}
          rows={[
            ["Actually spam", "TP = 20", "FN = 5"],
            ["Actually legit", "FP = 15", "TN = 10"],
          ]}
        />
        <MiniTable
          headers={["Metric", "Formula", "Value", "Simple English"]}
          rows={[
            ["Precision", "TP / (TP + FP)", "20 / (20 + 15) = 20/35 ≈ 0.57", "Of everything in the spam box, how much was really spam?"],
            ["Recall", "TP / (TP + FN)", "20 / (20 + 5) = 20/25 = 0.80", "Of all real spam, how much did we catch?"],
          ]}
        />
        <Callout tone="slate">
          More FP → precision ↓, recall unchanged. More FN → recall ↓, precision unchanged.
          Bridge to RAG: “spam” ≈ relevant chunk; “spam box” ≈ retrieved Top-K.
        </Callout>
      </Section>

      <Section kicker="2 · Context precision" title="Rank-aware — chunk ORDER matters">
        <p className="m-0 mb-3">
          Question: of the chunks we retrieved, how useful are they — especially near the top, where the LLM pays attention?
        </p>
        <Callout tone="slate">
          For each rank k where chunk_k is RELEVANT: Precision@k = (# relevant in 1..k) / k.
          Context Precision = average of those Precision@k values.
          Irrelevant ranks contribute 0 (they never open a @k term).
        </Callout>

        <p className="mb-1 mt-5 font-sans text-xs font-bold uppercase tracking-wider text-teal-700">
          Scenario A · good ranking (relevant on top)
        </p>
        <MiniTable
          headers={["Rank", "Chunk", "Relevant?"]}
          rows={[
            ["1", "30-day return", "YES"],
            ["2", "unused / packaging", "YES"],
            ["3", "return window from delivery", "YES"],
            ["4", "shipping ETA", "NO"],
            ["5", "warranty", "NO"],
          ]}
        />
        <MiniTable
          headers={["Relevant rank k", "Precision@k"]}
          rows={[
            ["1", "1/1 = 1.00"],
            ["2", "2/2 = 1.00"],
            ["3", "3/3 = 1.00"],
          ]}
        />
        <Callout tone="teal">
          Context Precision = (1.00 + 1.00 + 1.00) / 3 = <strong>1.00 (100%)</strong>
        </Callout>

        <p className="mb-1 mt-5 font-sans text-xs font-bold uppercase tracking-wider text-amber-700">
          Scenario B · SAME chunks, ORDER swapped (relevant buried)
        </p>
        <MiniTable
          headers={["Rank", "Chunk", "Relevant?"]}
          rows={[
            ["1", "shipping ETA", "NO"],
            ["2", "30-day return", "YES"],
            ["3", "unused / packaging", "YES"],
            ["4", "warranty", "NO"],
            ["5", "return window from delivery", "YES"],
          ]}
        />
        <MiniTable
          headers={["Relevant rank k", "Precision@k"]}
          rows={[
            ["2", "1/2 = 0.50"],
            ["3", "2/3 ≈ 0.67"],
            ["5", "3/5 = 0.60"],
          ]}
        />
        <Callout tone="amber">
          Context Precision = (0.50 + 0.67 + 0.60) / 3 ≈ <strong>0.59 (~59%)</strong>.
          Same set of chunks — classical relevant/retrieved stays 3/5 = 0.60 both times, but Context Precision drops when relevant items move down.
          Low score → <strong>05 rerank / 06 filter / smaller Top-K (11)</strong>.
        </Callout>
      </Section>

      <Section kicker="3 · Context recall" title="Did we fetch what we NEEDED?">
        <p className="m-0 mb-3">
          Question: of all relevant facts that exist for this query, what fraction made it into the retrieved context?
        </p>
        <Callout tone="slate">
          Context Recall = |relevant chunks retrieved| / |all relevant chunks needed|.
          NOT “relevant / retrieved” — that ratio is precision-shaped.
        </Callout>
        <MiniTable
          headers={["Needed fact", "In Top-K?"]}
          rows={[
            ["R1 · 30-day return policy", "yes"],
            ["R2 · unused / original packaging", "yes"],
            ["R3 · returns start from delivery date", "MISSING"],
          ]}
        />
        <p className="m-0 mb-3 text-slate-600">
          Retrieved noise in the pool: shipping, warranty, 70-day support.
        </p>
        <Callout>
          Context Recall = 2 / 3 ≈ <strong>0.67 (67%)</strong>.
          “3 relevant out of 5 retrieved = 60%” is closer to naive precision — do not call it recall.
          Low score → <strong>03 BM25 / 04 hybrid / 07 rewrite / 08 multi-query / 11 Top-K or parent-child / 09 decompose</strong>.
        </Callout>
      </Section>

      <Section kicker="4 · Answer relevancy" title="Does the reply address THIS query?">
        <p className="m-0 mb-3">Question: is the final answer on-topic, or did it drift?</p>
        <p className="m-0 mb-2 font-sans text-xs font-bold uppercase tracking-wider text-slate-500">Method (reverse query generation)</p>
        <ol className="mb-4 list-none space-y-2 pl-0">
          {[
            "Take the LLM response only (hide the user query).",
            "Ask a judge LLM: write 3 questions this answer could be answering.",
            "Embed each synthetic question + the real user query.",
            "Cosine-similarity(real query, synthetic_i) for i = 1..3.",
            "Answer Relevancy = average of those 3 similarities.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 font-mono text-xs font-bold text-blue-600 ring-1 ring-blue-500/20">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="m-0 mb-2 text-slate-600">
          Real query: return window. Answer drifts into warranty + shipping fluff.
        </p>
        <MiniTable
          headers={["Synthetic question", "Cosine to real query"]}
          rows={[
            ["Q1 about return window", "0.92"],
            ["Q2 about warranty length", "0.41"],
            ["Q3 about shipping ETA", "0.38"],
          ]}
        />
        <Callout tone="amber">
          Answer Relevancy = (0.92 + 0.41 + 0.38) / 3 ≈ <strong>0.57 (57%)</strong>.
          Low score → tighten system prompt / <strong>10 compress / 06 filter / 13 skip chitchat RAG</strong>.
        </Callout>
      </Section>

      <Section kicker="5 · Faithfulness" title="Atomic claim verification">
        <p className="m-0 mb-3">
          Question: does every claim stick to the retrieved context (no invention, no contradiction)?
        </p>
        <p className="m-0 mb-3 text-slate-600">
          Answer under test: “Return within 70 days if unused; email support for a label.”
          Context only supports 30-day returns + unused condition.
        </p>
        <MiniTable
          headers={["#", "Atomic claim", "In context?", "Verdict"]}
          rows={[
            ["1", "Return within 70 days", "NO (says 30)", "FAIL"],
            ["2", "Item must be unused / original packaging", "YES", "PASS"],
            ["3", "Contact support for a return label", "YES", "PASS"],
          ]}
        />
        <Callout>
          Faithfulness = 2 / 3 ≈ <strong>0.67 (67%)</strong>.
          Correct world knowledge that was never retrieved still FAILs — this metric is groundedness to context, not external truth.
          Low score → <strong>10 compress + grounded prompt</strong> / better precision so the prompt is not full of noise.
        </Callout>
      </Section>

      <Section kicker="6 · Together" title="How the four RAG metrics fit">
        <MiniTable
          headers={["Retrieval quality", "Generation quality"]}
          rows={[
            ["Context Recall", "Faithfulness (stick to context)"],
            ["Context Precision", "Answer Relevancy (stick to the question)"],
          ]}
        />
        <MiniTable
          headers={["Pattern", "What it means"]}
          rows={[
            ["High recall + low precision", "Right docs somewhere, buried in noise"],
            ["High precision + low recall", "Clean top ranks, missing a needed fact"],
            ["High both + low faithfulness", "Retrieve OK, prompt/model invents"],
            ["High faithfulness + low relevancy", "True to context, wrong question"],
          ]}
        />
      </Section>

      <Section kicker="7 · Fix map" title="Failure → what it looks like → open this lesson">
        <MiniTable
          headers={["Failure", "What it looks like", "Open next"]}
          rows={[
            [
              "Low CONTEXT RECALL / RETRIEVAL_MISS",
              "Empty or wrong files; invents or “I don't know”",
              "03 BM25 / 04 hybrid · 07 rewrite / 08 multi-query · 11 Top-K or parent-child",
            ],
            [
              "Low CONTEXT PRECISION",
              "Right neighborhood, wrong order / noise on top; best chunk is #3",
              "05 rerank / 06 metadata filter / smaller Top-K (11)",
            ],
            [
              "INCOMPLETE (multi-part)",
              "Need refund timing AND email; only one file comes back",
              "09 decompose / 12 iterative / 14 multi-source — do not over-filter with 06",
            ],
            [
              "CONTEXT_BLOAT / low FAITHFULNESS or RELEVANCY",
              "Prompt too long; invents portals/fees; answers the wrong ask",
              "10 compress + grounded prompt · 13 agent-driven (skip chitchat)",
            ],
          ]}
        />
        <p className="m-0 mt-3 text-slate-600">
          02–04 teach how search works (dense / sparse / hybrid). 05–14 are the fixes named above.
          15–18 are placeholders (HyDE, CRAG/Self-RAG, adaptive router, GraphRAG).
        </p>
      </Section>
    </div>
  );
}
