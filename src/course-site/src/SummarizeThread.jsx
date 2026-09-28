import { useState } from "react";

const TURNS = [
  { who: "Human", text: "ORD-1 was a gift." },
  { who: "Assistant", text: "Noted. ORD-1 is a gift." },
  { who: "Human", text: "Contact me by email, not phone." },
  { who: "Assistant", text: "I will use email." },
  { who: "Human", text: "The box arrived damaged." },
  { who: "Assistant", text: "Damage is on the ticket." },
  { who: "Human", text: "Where is ORD-1?" },
  { who: "Assistant", text: "ORD-1 is shipped." },
];

const SUMMARY =
  "ORD-1 was a gift. Contact the customer by email, not phone. The box arrived damaged.";

export function SummarizeThread() {
  const [index, setIndex] = useState(0);
  const visible = TURNS.slice(0, index + 1);
  const collapsed = index >= 6;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">InMemorySaver</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">
        {collapsed
          ? "The saver still has the thread. The model is shown the summary plus the last turns."
          : "Each turn stays on the thread. Move forward until the summary takes the old ones."}
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
          <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">What the saver holds</p>
          <ul className="m-0 mt-2 list-none space-y-2 pl-0">
            {visible.map((turn) => (
              <li key={turn.text} className="font-serif text-sm text-slate-200">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-teal-300">{turn.who}</span>
                <span className="mt-0.5 block">{turn.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
          <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">What the model is shown</p>
          {collapsed ? (
            <ul className="m-0 mt-2 list-none space-y-2 pl-0">
              <li className="rounded-lg bg-amber-200 px-2 py-2 font-serif text-sm text-amber-950">{SUMMARY}</li>
              {visible.slice(-2).map((turn) => (
                <li key={turn.text} className="font-serif text-sm text-slate-200">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-teal-300">{turn.who}</span>
                  <span className="mt-0.5 block">{turn.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 mt-2 font-serif text-sm text-slate-400">The same messages. Nothing has been folded yet.</p>
          )}
        </div>
      </div>
      <label className="mt-4 block">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {collapsed ? "Summary in place" : `Turn ${index + 1}`}
        </span>
        <input
          type="range"
          min={0}
          max={TURNS.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="mt-3 w-full accent-teal-400"
        />
      </label>
    </div>
  );
}
