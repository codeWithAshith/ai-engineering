export function FlowDiagram({ diagram }) {
  if (!diagram?.steps?.length) return null;
  const across = diagram.direction === "across";

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">{diagram.kicker}</p>
      {diagram.caption ? <p className="mt-1 mb-4 font-serif text-lg text-slate-200">{diagram.caption}</p> : <div className="mb-4" />}
      <div className={across ? "flex flex-col gap-2 sm:flex-row sm:items-stretch" : "flex flex-col gap-2"}>
        {diagram.steps.map((step, i) => (
          <div key={step.label} className={across ? "flex flex-1 items-center gap-2" : "flex flex-col gap-2"}>
            <div className="min-w-0 flex-1 rounded-xl border border-slate-600 bg-slate-800 px-3 py-3">
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">{step.label}</p>
              <p className="m-0 mt-1 font-serif text-sm leading-snug text-slate-100">{step.detail}</p>
            </div>
            {i < diagram.steps.length - 1 ? (
              <span className={`font-mono text-lg text-teal-300 ${across ? "hidden sm:inline" : "pl-1"}`}>
                {across ? "|" : "↓"}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {diagram.outcomes?.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {diagram.outcomes.map((item) => (
            <div key={item.label} className="rounded-xl border border-dashed border-slate-600 bg-slate-900 px-3 py-3">
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">{item.label}</p>
              <p className="m-0 mt-1 font-serif text-sm leading-snug text-slate-200">{item.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
