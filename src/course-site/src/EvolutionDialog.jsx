import { ClockCounterClockwise, X } from "@phosphor-icons/react";
import { useEffect } from "react";

export function EvolutionButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
    >
      <ClockCounterClockwise size={14} weight="bold" />
      <span className="hidden sm:inline">How It Evolved</span>
      <span className="sm:hidden">Evolution</span>
    </button>
  );
}

export function EvolutionDialog({ evolution, open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !evolution) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl h-[88vh] rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-line shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 shrink-0">
              <ClockCounterClockwise size={20} weight="bold" />
            </div>
            <div>
              <h2 className="m-0 font-sans text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {evolution.title}
              </h2>
              <p className="m-0 font-serif text-xs text-slate-500">{evolution.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 bg-slate-50/50">
          <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-3 before:w-0.5 before:bg-indigo-200">
            {evolution.eras.map((era, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 sm:-left-8 top-1.5 flex items-center justify-center">
                  <span className="h-3 w-3 rounded-full border-2 border-indigo-600 bg-white" />
                </div>
                <div className="rounded-xl border border-line bg-white p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-sans text-sm font-extrabold text-slate-900">{era.name}</span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 border border-indigo-200/60">
                        {era.era}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{era.years}</span>
                    </div>
                  </div>
                  <p className="font-serif text-xs sm:text-[13px] text-slate-700 m-0 leading-relaxed">{era.what}</p>
                  {era.flaw ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-2.5 text-xs text-rose-950 flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-700 shrink-0 mt-0.5">
                        The Bottleneck:
                      </span>
                      <span className="font-serif leading-snug text-slate-700">{era.flaw}</span>
                    </div>
                  ) : null}
                  {era.standard ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs text-emerald-950 flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 shrink-0 mt-0.5">
                        Current Standard:
                      </span>
                      <span className="font-serif leading-snug text-slate-700">{era.standard}</span>
                    </div>
                  ) : null}
                  {era.shift ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 text-xs text-blue-950 flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-700 shrink-0 mt-0.5">
                        The Shift:
                      </span>
                      <span className="font-serif leading-snug text-slate-700">{era.shift}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {evolution.takeaway ? (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-xs sm:text-[13px] text-indigo-950 shadow-xs">
              <strong className="font-sans font-bold block mb-1 text-indigo-900">Why this matters today:</strong>
              <p className="font-serif m-0 leading-relaxed text-slate-800">{evolution.takeaway}</p>
            </div>
          ) : null}
        </div>
        <div className="px-5 py-2.5 bg-white border-t border-line flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-mono">Press Esc or click outside to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
