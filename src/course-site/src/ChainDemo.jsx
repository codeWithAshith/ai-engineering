import { useEffect, useState } from "react";

const STEPS = [
  { id: "input", label: "inputs", detail: '{ "country": "France" }' },
  { id: "prompt", label: "prompt", detail: "What is the capital of France?" },
  { id: "model", label: "model", detail: "invoke(messages)" },
  { id: "out", label: "AIMessage", detail: "The capital of France is Paris." },
];

export function ChainDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((n) => (n + 1) % STEPS.length), 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">prompt | model</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">
        One invoke. The pipe runs the steps in the order you wrote.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {STEPS.map((item, i) => (
          <div key={item.id} className="flex flex-1 items-center gap-2">
            <div
              className={`min-w-0 flex-1 rounded-xl border px-3 py-3 transition-colors duration-500 ${
                i === step
                  ? "border-teal-300 bg-teal-400 text-slate-950"
                  : i < step
                    ? "border-slate-600 bg-slate-800 text-slate-200"
                    : "border-dashed border-slate-700 bg-slate-900 text-slate-500"
              }`}
            >
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider">{item.label}</p>
              <p className="m-0 mt-1 font-serif text-sm leading-snug">{item.detail}</p>
            </div>
            {i < STEPS.length - 1 ? (
              <span className={`hidden font-mono text-lg sm:inline ${i < step ? "text-teal-300" : "text-slate-600"}`}>|</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
