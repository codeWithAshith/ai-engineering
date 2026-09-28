import { useState } from "react";

const STEPS = [
  {
    id: "function",
    label: "The function",
    caption: "You write a normal function. The model does not receive this file.",
  },
  {
    id: "name",
    label: "Name",
    caption: "The function name becomes the tool name. lookup_order is how the model asks for it.",
  },
  {
    id: "description",
    label: "Description",
    caption: "The docstring becomes the description. This is how the model decides when to call it.",
  },
  {
    id: "args",
    label: "Arguments",
    caption: "The parameters become the arguments. order_id: str is the only field the model fills in.",
  },
  {
    id: "dump",
    label: "The dump",
    caption: "Name, description, and arguments. That is the tool. The body stays in Python.",
  },
];

export function ToolDump() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const showName = index >= 1;
  const showDoc = index >= 2;
  const showArgs = index >= 3;
  const showDump = index >= 4;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">The tool</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">{step.caption}</p>
      <div className="overflow-x-auto rounded-xl border border-dashed border-slate-600 bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 sm:text-[15px]">
        <p className="m-0 whitespace-nowrap text-slate-400">@tool</p>
        <p className="m-0 whitespace-nowrap">
          def{" "}
          <span className={showName ? "rounded-md bg-emerald-200 px-1 py-0.5 font-semibold text-emerald-950" : ""}>
            lookup_order
          </span>
          (
          <span className={showArgs ? "rounded-md bg-amber-200 px-1 py-0.5 font-semibold text-amber-950" : ""}>
            order_id: str
          </span>
          ) -&gt; str:
        </p>
        <p className="m-0 whitespace-nowrap">
          {"    "}
          <span className={showDoc ? "rounded-md bg-sky-200 px-1 py-0.5 text-sky-950" : ""}>
            &quot;Look up one order&apos;s status by id.&quot;
          </span>
        </p>
        <p className={`m-0 whitespace-nowrap ${showDump ? "text-slate-300 line-through" : "text-slate-500"}`}>
          {"    "}return ORDERS.get(order_id, ...)
        </p>
      </div>
      {showDump ? (
        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900 p-4 font-mono text-sm">
          <p className="m-0 text-emerald-300">name: lookup_order</p>
          <p className="m-0 mt-2 text-sky-200">description: Look up one order&apos;s status by id.</p>
          <p className="m-0 mt-2 text-amber-200">args: {"{ order_id: str }"}</p>
        </div>
      ) : null}
      <label className="mt-4 block">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {step.label}
        </span>
        <input
          type="range"
          min={0}
          max={STEPS.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="mt-3 w-full accent-teal-400"
          aria-valuetext={step.label}
        />
      </label>
      <div className="mt-1 grid grid-cols-5 gap-1 text-center font-sans text-[11px] text-slate-400">
        {STEPS.map((item, i) => (
          <button
            key={item.id}
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
