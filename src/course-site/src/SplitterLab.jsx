import { useState } from "react";

const SOURCE = `Customers may request a refund within 45 days of delivery if they have the order receipt. Refunds for ORD orders are issued to the original payment method within 5 to 7 business days after approval. Partial refunds are allowed when only some line items are returned. Damaged items require a photo uploaded to the support ticket before approval.`;

const CASES = [
  {
    name: "Character",
    note: "Splitting is chunking. CharacterTextSplitter cuts on spaces, size 120, overlap 0. The next chunk starts where the last one stopped. Nothing is repeated.",
    chunks: [
      "Customers may request a refund within 45 days of delivery if they have the order receipt. Refunds for ORD orders are",
      "issued to the original payment method within 5 to 7 business days after approval. Partial refunds are allowed when only",
      "some line items are returned. Damaged items require a photo uploaded to the support ticket before approval.",
    ],
  },
  {
    name: "Recursive",
    note: "On a short line, recursive never overlaps, because each line already fits. This paragraph is longer than 120 characters, so it cuts on spaces and chunk_overlap 40 copies the tail of one chunk onto the start of the next. “receipt. Refunds for ORD orders are” is in chunk 1 and again in chunk 2.",
    chunks: [
      { text: "Customers may request a refund within 45 days of delivery if they have the order receipt. Refunds for ORD orders are" },
      { lead: "receipt. Refunds for ORD orders are ", text: "issued to the original payment method within 5 to 7 business days after approval." },
      { lead: "5 to 7 business days after approval. ", text: "Partial refunds are allowed when only some line items are returned. Damaged items" },
      { lead: "line items are returned. Damaged items ", text: "require a photo uploaded to the support ticket before approval." },
    ],
  },
  {
    name: "Token",
    note: "TokenTextSplitter counts tokens, not characters. chunk_size 19 with cl100k_base. Refunds is two tokens, Ref and unds, so the cut lands inside the word. Overlap is 0, so the next chunk does not repeat a tail. The photo line is still in the last chunks.",
    chunks: [
      "Customers may request a refund within 45 days of delivery if they have the order receipt. Ref",
      "unds for ORD orders are issued to the original payment method within 5 to 7 business days",
      " after approval. Partial refunds are allowed when only some line items are returned. Damaged items require",
      " a photo uploaded to the support ticket before approval.",
    ],
  },
  {
    name: "Sentence",
    note: "Splitting is chunking. A sentence splitter cuts on each period. Each sentence stays whole. Overlap is not part of this cut.",
    chunks: [
      "Customers may request a refund within 45 days of delivery if they have the order receipt.",
      "Refunds for ORD orders are issued to the original payment method within 5 to 7 business days after approval.",
      "Partial refunds are allowed when only some line items are returned.",
      "Damaged items require a photo uploaded to the support ticket before approval.",
    ],
  },
];

export function SplitterLab() {
  const [caseIdx, setCaseIdx] = useState(0);
  const spec = CASES[caseIdx];

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">Same paragraph</p>
      <p className="mt-1 mb-3 font-serif text-lg text-slate-200">Switch the splitter. The refund policy does not change.</p>
      <pre className="m-0 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[13px] leading-relaxed text-slate-300">{SOURCE}</pre>
      <div className="my-3 flex flex-wrap gap-2">
        {CASES.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setCaseIdx(index)}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 font-sans text-xs font-semibold ${
              index === caseIdx ? "border-teal-400 bg-teal-400 text-slate-950" : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {spec.chunks.map((chunk, index) => {
          const text = typeof chunk === "string" ? chunk : chunk.text;
          const lead = typeof chunk === "string" ? "" : chunk.lead || "";
          return (
            <div key={`${index}-${text}`} className="rounded-lg border border-teal-400 bg-teal-400/15 px-3 py-2">
              <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-wider text-teal-300">Chunk {index + 1}</p>
              <p className="m-0 mt-1 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-slate-100">
                {lead ? <span className="rounded bg-amber-300/30 text-amber-100">{lead}</span> : null}
                {text}
              </p>
            </div>
          );
        })}
      </div>
      <p className="m-0 mt-3 font-mono text-[11px] text-slate-500">{spec.chunks.length} chunks · the paragraph is all here</p>
      <p className="m-0 mt-3 rounded-xl border border-teal-900/40 bg-teal-950/30 px-3.5 py-2.5 font-serif text-sm text-teal-100">{spec.note}</p>
    </div>
  );
}
