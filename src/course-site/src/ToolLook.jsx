const COLUMNS = [
  {
    id: "vague",
    label: "One tool, every job",
    name: "support_action",
    description: "Handle support actions.",
    args: "action: str, order_id: str, amount: float",
    note: "Lookup and refund are hidden inside action. The model has to guess the string.",
  },
  {
    id: "clear",
    label: "One job per tool",
    name: "lookup_order_status",
    description: "Look up one order by id. Use for “where is my order?”. Not for refunds.",
    args: "order_id: str",
    note: "The name is the job. The description says when, and when not.",
  },
];

export function ToolLook() {
  return (
    <div className="mb-6 grid gap-3 lg:grid-cols-2">
      {COLUMNS.map((col) => (
        <section key={col.id} className="rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
          <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">{col.label}</p>
          <p className="mt-3 mb-0 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</p>
          <p className="m-0 mt-1 font-mono text-sm text-teal-200">{col.name}</p>
          <p className="m-0 mt-3 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</p>
          <p className="m-0 mt-1 font-serif text-sm leading-relaxed text-slate-100">{col.description}</p>
          <p className="m-0 mt-3 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-500">Args</p>
          <p className="m-0 mt-1 font-mono text-sm text-amber-200">{col.args}</p>
          <p className="m-0 mt-3 font-serif text-sm text-slate-400">{col.note}</p>
        </section>
      ))}
    </div>
  );
}
