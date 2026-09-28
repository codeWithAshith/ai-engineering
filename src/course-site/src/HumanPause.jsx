import { useState } from "react";

const STEPS = [
  {
    label: "The question",
    status: "ORD-1 is shipped",
    detail: "Set ORD-1 to delivered.",
    note: "The model wants to call update_order_status. The tool has not run.",
  },
  {
    label: "Paused",
    status: "ORD-1 is shipped",
    detail: "Waiting for a person.",
    note: "HumanInTheLoopMiddleware holds the write. The thread stays in InMemorySaver.",
  },
  {
    label: "Approved",
    status: "ORD-1 is delivered",
    detail: "The person said approve.",
    note: "The same thread resumes. Then the tool runs.",
  },
];

export function HumanPause() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">One question</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">{step.detail}</p>
      <p className="m-0 font-mono text-sm text-amber-200">{step.status}</p>
      <p className="mt-3 mb-0 font-serif text-sm text-slate-300">{step.note}</p>
      <label className="mt-4 block">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">{step.label}</span>
        <input
          type="range"
          min={0}
          max={STEPS.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="mt-3 w-full accent-teal-400"
        />
      </label>
      <div className="mt-1 grid grid-cols-3 gap-1 text-center font-sans text-[11px] text-slate-400">
        {STEPS.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setIndex(i)}
            className={`cursor-pointer bg-transparent px-0 py-1 ${i === index ? "font-bold text-teal-300" : "text-slate-400"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
