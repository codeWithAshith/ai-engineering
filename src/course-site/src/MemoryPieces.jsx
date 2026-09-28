const PIECES = [
  {
    name: "Saver",
    job: "This chat",
    detail: "InMemorySaver keeps the messages under one thread_id.",
  },
  {
    name: "Summary",
    job: "Old turns",
    detail: "SummarizationMiddleware folds those old turns into one note.",
  },
  {
    name: "Store",
    job: "A fact",
    detail: "The Store keeps email-not-phone after this chat is gone.",
  },
];

export function MemoryPieces() {
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">Three small pieces</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">Each one does one job. On the agent, you pass them together.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {PIECES.map((piece) => (
          <section key={piece.name} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-wider text-teal-300">{piece.name}</p>
            <p className="m-0 mt-2 font-serif text-lg text-white">{piece.job}</p>
            <p className="m-0 mt-2 font-serif text-sm leading-relaxed text-slate-300">{piece.detail}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
