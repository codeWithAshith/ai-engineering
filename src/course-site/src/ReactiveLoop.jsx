export function ReactiveLoop() {
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">Reactive agent</p>
      <p className="mt-1 mb-5 font-serif text-lg text-slate-200">No plan. Act, observe the result, come back, then answer.</p>
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-3">
        <div className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-3">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">Model</p>
          <p className="m-0 mt-1 font-serif text-sm text-slate-100">Sees “Where is ORD-1?” and picks lookup.</p>
        </div>
        <div className="text-center">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">act</p>
          <p className="m-0 font-mono text-lg text-teal-300">→</p>
        </div>
        <div className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-3">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">Tool</p>
          <p className="m-0 mt-1 font-serif text-sm text-slate-100">lookup_order_status returns shipped.</p>
        </div>
        <div className="col-span-3 flex items-center justify-center gap-2 py-1">
          <span className="h-px flex-1 bg-teal-400/70" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">observe the result, come back</span>
          <span className="font-mono text-lg text-teal-300">←</span>
          <span className="h-px w-8 bg-teal-400/70" />
        </div>
        <div className="col-span-3 rounded-xl border border-teal-300 bg-teal-400 px-3 py-3 text-slate-950">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider">Then answer</p>
          <p className="m-0 mt-1 font-serif text-sm">The model reads “shipped” and stops. ORD-1 is shipped.</p>
        </div>
      </div>
    </div>
  );
}
