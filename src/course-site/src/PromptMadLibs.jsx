import { useState } from "react";

const TOPICS = ["Quantum Physics", "Baking a Cake", "Ancient Rome", "React Hooks"];

export function PromptMadLibs() {
  const [index, setIndex] = useState(3);
  const topic = TOPICS[index];

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">The template</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">The sentence stays. The highlighted word is the variable.</p>
      <div className="rounded-xl border border-dashed border-slate-600 bg-white p-4 text-slate-900">
        <p className="m-0 mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">ChatPromptTemplate</p>
        <p className="m-0 font-serif text-xl leading-relaxed sm:text-2xl">
          “Explain <span className="rounded-md bg-emerald-200 px-1.5 py-0.5 font-semibold text-emerald-950">{topic}</span> to me like I am five years old.”
        </p>
      </div>
      <label className="mt-4 block">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">Topic — the value that fills {"{topic}"}</span>
        <input
          type="range"
          min={0}
          max={TOPICS.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="mt-3 w-full accent-teal-400"
          aria-valuetext={topic}
        />
      </label>
      <div className="mt-1 grid grid-cols-4 gap-1 text-center font-sans text-[11px] text-slate-400 sm:text-xs">
        {TOPICS.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => setIndex(i)}
            className={`cursor-pointer bg-transparent px-0 py-1 ${i === index ? "font-bold text-teal-300" : "text-slate-400"}`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
