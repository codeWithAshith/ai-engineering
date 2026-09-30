import { useEffect, useState } from "react";

const STEPS = [
  {
    note: "The text is still words. Nothing is a vector yet.",
    rows: [
      { label: "Text", value: "refund window" },
      { label: "Vector", value: "—" },
    ],
  },
  {
    note: "Split into tokens. In this toy, each word is one token.",
    rows: [
      { label: "Tokens", value: "refund    window" },
      { label: "Vector", value: "—" },
    ],
  },
  {
    note: "Each token already has three numbers. refund points at money-back. window sits next to it.",
    rows: [
      { label: "refund", value: "[0.90, 0.10, 0.00]" },
      { label: "window", value: "[0.80, 0.20, 0.00]" },
    ],
  },
  {
    note: "The embedding of the phrase is the average. That list of numbers is the vector.",
    rows: [
      { label: "refund window", value: "[0.85, 0.15, 0.00]" },
      { label: "shipping days", value: "[0.05, 0.15, 0.85]" },
    ],
  },
  {
    note: "The two vectors point different ways, so a refund question lands nearer the refund chunk than the shipping chunk. The index file replaces this toy with nomic-embed-text and prints the length of that long vector as dims.",
    rows: [
      { label: "Toy", value: "3 numbers you can read" },
      { label: "Index file", value: "nomic-embed-text · one long vector · dims" },
    ],
  },
];

export function EmbeddingLab() {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setStep((current) => {
        const next = current < 0 ? 0 : current + 1;
        if (next >= STEPS.length) {
          setPlaying(false);
          return STEPS.length - 1;
        }
        return next;
      });
    }, 1400);
    return () => clearInterval(timer);
  }, [playing]);
  const beat = step < 0 ? STEPS[0] : STEPS[step];
  const showBars = step >= 3;
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">Tokens → vector</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">That conversion is an embedding. A simple one is three numbers.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {beat.rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-teal-400 bg-teal-400/15 px-3 py-2">
            <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-wider text-teal-300">{row.label}</p>
            <p className="m-0 mt-1 font-mono text-[13px] text-slate-100">{row.value}</p>
          </div>
        ))}
      </div>
      {showBars ? (
        <div className="mt-4 grid gap-3">
          <Bar name="refund window" values={[0.85, 0.15, 0.0]} />
          <Bar name="shipping days" values={[0.05, 0.15, 0.85]} />
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
        <button type="button" onClick={() => { setStep(0); setPlaying(true); }} className="cursor-pointer rounded-lg border border-teal-400 bg-teal-400 px-3 py-1.5 font-sans text-xs font-semibold text-slate-950">Play</button>
        <button type="button" onClick={() => { setPlaying(false); setStep((c) => Math.max(0, c < 0 ? 0 : c - 1)); }} className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200">Step back</button>
        <button type="button" onClick={() => { setPlaying(false); setStep((c) => Math.min(STEPS.length - 1, c < 0 ? 0 : c + 1)); }} className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200">Step</button>
        <span className="font-mono text-[11px] text-slate-500">{step < 0 ? "press Play" : `${step + 1} / ${STEPS.length}`}</span>
      </div>
      <p className="m-0 mt-3 rounded-xl border border-teal-900/40 bg-teal-950/30 px-3.5 py-2.5 font-serif text-sm text-teal-100">{step < 0 ? "Press Play. Watch the words become three numbers." : beat.note}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {CHOICES.map((item) => (
          <div key={item.name} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
            <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-wider text-teal-300">{item.when}</p>
            <p className="m-0 mt-1 font-serif text-sm text-slate-100">{item.name}</p>
            <p className="m-0 mt-1 font-mono text-[11px] leading-relaxed text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHOICES = [
  { when: "In this room", name: "Toy average", detail: "3 numbers. Shows the shape. Do not search with it." },
  { when: "This course", name: "nomic-embed-text", detail: "Local. English policy. Same model for the chunk and the question." },
  { when: "Off this machine", name: "Hosted embedding API", detail: "Index and query both call that API. Do not mix with nomic vectors." },
];

function Bar({ name, values }) {
  return (
    <div>
      <p className="m-0 mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">{name}</p>
      <div className="flex gap-2">
        {values.map((value, index) => (
          <div key={index} className="flex-1">
            <div className="h-16 rounded bg-slate-900 flex items-end overflow-hidden">
              <div className="w-full bg-teal-400" style={{ height: `${Math.max(8, value * 100)}%` }} />
            </div>
            <p className="m-0 mt-1 text-center font-mono text-[11px] text-slate-300">{value.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
