import { useState } from "react";

export function ResponseShape() {
  const [typed, setTyped] = useState(true);

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">Same question</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">Status of ORD-1. Switch what the app is allowed to read.</p>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTyped(false)}
          className={`cursor-pointer rounded-full border px-3 py-1.5 font-sans text-sm ${
            !typed ? "border-teal-300 bg-teal-400 font-semibold text-slate-950" : "border-slate-600 bg-slate-900 text-slate-300"
          }`}
        >
          A paragraph
        </button>
        <button
          type="button"
          onClick={() => setTyped(true)}
          className={`cursor-pointer rounded-full border px-3 py-1.5 font-sans text-sm ${
            typed ? "border-teal-300 bg-teal-400 font-semibold text-slate-950" : "border-slate-600 bg-slate-900 text-slate-300"
          }`}
        >
          response_format
        </button>
      </div>
      <div className="rounded-xl border border-dashed border-slate-600 bg-white p-4 text-slate-900">
        {typed ? (
          <p className="m-0 font-serif text-xl leading-relaxed sm:text-2xl">
            order_id = <span className="rounded-md bg-emerald-200 px-1.5 py-0.5 font-semibold text-emerald-950">ORD-1</span>
            <br />
            status = <span className="rounded-md bg-emerald-200 px-1.5 py-0.5 font-semibold text-emerald-950">shipped</span>
          </p>
        ) : (
          <p className="m-0 font-serif text-xl leading-relaxed sm:text-2xl">The order ORD-1 has shipped, according to our records.</p>
        )}
        <p className="m-0 mt-3 font-mono text-xs text-slate-500">
          {typed ? "App reads structured_response.status" : "App has to parse the sentence"}
        </p>
      </div>
    </div>
  );
}
