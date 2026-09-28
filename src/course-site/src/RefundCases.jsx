import { useState } from "react";

const CASES = [
  {
    id: "input",
    label: "$999",
    order: "ORD-1",
    kind: "Bad input",
    result: "ERROR: amount > 500",
  },
  {
    id: "missing",
    label: "$10",
    order: "ORD-999",
    kind: "Bad data",
    result: "ERROR: order not found",
  },
  {
    id: "ok",
    label: "$40",
    order: "ORD-1",
    kind: "Ok",
    result: "Refunded $40.00 on ORD-1",
  },
];

export function RefundCases() {
  const [index, setIndex] = useState(0);
  const item = CASES[index];
  const bad = item.id !== "ok";

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">issue_refund</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">Change the request. The tool still returns text. The agent stays up.</p>
      <div className="rounded-xl border border-dashed border-slate-600 bg-white p-4 text-slate-900">
        <p className="m-0 font-serif text-xl leading-relaxed sm:text-2xl">
          “Refund{" "}
          <span className="rounded-md bg-emerald-200 px-1.5 py-0.5 font-semibold text-emerald-950">{item.label}</span> on{" "}
          <span className="rounded-md bg-emerald-200 px-1.5 py-0.5 font-semibold text-emerald-950">{item.order}</span>.”
        </p>
        <p className={`m-0 mt-4 font-mono text-sm ${bad ? "text-amber-800" : "text-emerald-800"}`}>{item.result}</p>
        <p className="m-0 mt-1 font-sans text-xs uppercase tracking-wider text-slate-400">{item.kind} → back to the agent</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {CASES.map((row, i) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`cursor-pointer rounded-full border px-2 py-1.5 font-sans text-xs sm:text-sm ${
              i === index ? "border-teal-300 bg-teal-400 font-semibold text-slate-950" : "border-slate-600 bg-slate-900 text-slate-300"
            }`}
          >
            {row.kind}
          </button>
        ))}
      </div>
    </div>
  );
}
