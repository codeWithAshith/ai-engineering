import {
  ArrowRight,
  ArrowsIn,
  ArrowsOut,
  CaretLeft,
  CaretRight,
  CheckCircle,
  ClockCounterClockwise,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Rich } from "./Blocks.jsx";
import { SLIDE_DIAGRAMS } from "./TermDiagrams.jsx";
import { termsDeck, termsHref } from "./terms.js";

export { termsHref };

export function TermsCarousel({ slideId }) {
  const slides = termsDeck.slides;
  const found = slides.findIndex((s) => s.id === slideId);
  const index = found >= 0 ? found : 0;
  const slide = slides[index];
  const prev = slides[index - 1];
  const next = slides[index + 1];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false);

  // Close modals when slide changes
  useEffect(() => {
    setIsModalOpen(false);
    setIsEvolutionOpen(false);
  }, [slideId]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setIsEvolutionOpen(false);
        return;
      }
      if (isModalOpen || isEvolutionOpen) return; // don't navigate slides if modal is open
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowLeft" && prev) {
        event.preventDefault();
        location.hash = termsHref(prev.id);
      }
      if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        location.hash = termsHref(next.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, isModalOpen, isEvolutionOpen]);

  const DiagramComponent = SLIDE_DIAGRAMS[slide.id];
  const isIframeSlide = Boolean(slide.iframe);

  return (
    <article className="relative flex flex-col h-full min-h-0 w-full">
      {/* Pinned Top Header */}
      <header className="shrink-0 pb-2.5 border-b border-line">
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0 font-sans text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            {slide.term}
          </h1>
          <div className="flex items-center gap-2">
            {slide.evolution ? (
              <button
                type="button"
                onClick={() => setIsEvolutionOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs cursor-pointer"
              >
                <ClockCounterClockwise size={14} weight="bold" />
                <span className="hidden sm:inline">How It Evolved</span>
                <span className="sm:hidden">Evolution</span>
              </button>
            ) : null}
            <a
              href={prev ? termsHref(prev.id) : undefined}
              aria-disabled={!prev}
              className={`inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold no-underline transition-all ${
                prev ? "bg-white text-ink shadow-xs hover:bg-slate-50" : "opacity-30 pointer-events-none text-slate-400"
              }`}
            >
              <CaretLeft size={14} weight="bold" />
              Prev
            </a>
            <a
              href={next ? termsHref(next.id) : undefined}
              aria-disabled={!next}
              className={`inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 no-underline transition-all ${
                next ? "shadow-xs hover:bg-blue-100" : "opacity-30 pointer-events-none text-slate-400"
              }`}
            >
              Next
              <CaretRight size={14} weight="bold" />
            </a>
          </div>
        </div>

        <p className="mt-1 mb-0 font-serif text-[1.05rem] leading-snug text-slate-700">
          {slide.oneLiner}
        </p>
      </header>

      {/* Middle Scrollable Section - Only this part scrolls if content overflows */}
      <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 pr-1 space-y-4">
        {/* Notes */}
        {slide.notes?.length ? (
          <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
            <h3 className="m-0 mb-2.5 flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-slate-400">
              <CheckCircle size={14} weight="bold" className="text-blue-600" />
              Notes
            </h3>
            <ul className="m-0 list-none space-y-2 pl-0 font-serif text-[0.98rem] leading-relaxed text-slate-800">
              {slide.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span className="flex-1">
                    <Rich text={note} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Visual Diagram or Interactive Iframe below the notes ("keep it to the bottom like how it was") */}
        {isIframeSlide ? (
          <div className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
              <div>
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-700">
                  Interactive Visualizer
                </span>
                <span className="ml-2 font-mono text-[11px] text-slate-400">Temperature & Top-K Sampling</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-xs"
              >
                <ArrowsOut size={13} weight="bold" />
                Expand to Dialog
              </button>
            </div>

            {/* Embedded Preview with clickable expand overlay */}
            <div className="relative group rounded-xl overflow-hidden border border-line bg-[#212529]">
              <ScaledIframe src={slide.iframe} title={`${slide.term} visualizer`} />
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="absolute inset-0 bg-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40"
                aria-label="Click to expand into full dialog view"
              >
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-md">
                  <ArrowsOut size={14} weight="bold" />
                  Click to Expand into Dialog
                </span>
              </button>
            </div>
          </div>
        ) : DiagramComponent ? (
          <div className="mt-1">
            <DiagramComponent />
          </div>
        ) : null}

        {/* Contrast Example */}
        {slide.example ? (
          <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-3.5 shadow-xs">
            <p className="m-0 mb-1 font-sans text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Example
            </p>
            <p className="m-0 font-serif text-[0.98rem] leading-relaxed text-slate-800">
              <Rich text={slide.example} />
            </p>
          </div>
        ) : null}
      </div>

      {/* Pinned Bottom Footer */}
      <footer className="shrink-0 border-t border-line pt-3 pb-1 flex items-center justify-between gap-2">
        {prev ? (
          <a
            href={termsHref(prev.id)}
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 no-underline transition-colors hover:text-blue-600 shrink-0"
          >
            <CaretLeft size={15} weight="bold" className="transition-transform group-hover:-translate-x-0.5 shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-[150px] md:max-w-none">Prev: {prev.term}</span>
          </a>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center max-w-[45%] sm:max-w-[60%]">
          {slides.map((item, i) => (
            <a
              key={item.id}
              href={termsHref(item.id)}
              aria-label={item.term}
              aria-current={i === index ? "true" : undefined}
              className={`h-2 rounded-full no-underline transition-all ${
                i === index ? "w-5 bg-blue-600" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        {next ? (
          <a
            href={termsHref(next.id)}
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 no-underline transition-colors hover:text-blue-700 shrink-0"
          >
            <span className="truncate max-w-[80px] sm:max-w-[150px] md:max-w-none">Next: {next.term}</span>
            <CaretRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5 shrink-0" />
          </a>
        ) : (
          <a
            href="#/d/1"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white no-underline shadow-xs hover:bg-blue-500 shrink-0"
          >
            Proceed to Day 1
            <ArrowRight size={13} weight="bold" />
          </a>
        )}
      </footer>

      {/* Fullscreen Expandable Dialog Modal */}
      {isModalOpen && slide.iframe ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative flex flex-col w-full max-w-5xl h-[88vh] rounded-2xl border border-line bg-[#212529] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-bold text-white">
                  Temperature, Top-K & Top-P Visualizer
                </span>
                <span className="hidden sm:inline-block font-mono text-xs text-slate-400">
                  Gemma 3 1B Sampling
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowsIn size={14} weight="bold" />
                  Minimize
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Modal Iframe Body */}
            <div className="flex-1 min-h-0 w-full bg-[#212529]">
              <iframe
                title="Expanded Visualizer"
                src={slide.iframe}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Evolution Timeline Dialog Modal */}
      {isEvolutionOpen && slide.evolution ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm"
          onClick={() => setIsEvolutionOpen(false)}
        >
          <div
            className="relative flex flex-col w-full max-w-3xl h-[88vh] rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-line shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 shrink-0">
                  <ClockCounterClockwise size={20} weight="bold" />
                </div>
                <div>
                  <h2 className="m-0 font-sans text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {slide.evolution.title}
                  </h2>
                  <p className="m-0 font-serif text-xs text-slate-500">
                    {slide.evolution.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEvolutionOpen(false)}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowsIn size={13} weight="bold" />
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setIsEvolutionOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Timeline Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 bg-slate-50/50">
              <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-3 before:w-0.5 before:bg-indigo-200">
                {slide.evolution.eras.map((era, idx) => (
                  <div key={idx} className="relative">
                    {/* Timeline Dot */}
                    <div className="absolute -left-6 sm:-left-8 top-1.5 flex items-center justify-center">
                      <span className="h-3 w-3 rounded-full border-2 border-indigo-600 bg-white" />
                    </div>

                    {/* Era Card */}
                    <div className="rounded-xl border border-line bg-white p-4 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-sans text-sm font-extrabold text-slate-900">
                          {era.name}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 border border-indigo-200/60">
                            {era.era}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                            {era.years}
                          </span>
                        </div>
                      </div>

                      <p className="font-serif text-xs sm:text-[13px] text-slate-700 m-0 leading-relaxed">
                        {era.what}
                      </p>

                      {/* The Bottleneck / Flaw */}
                      {era.flaw ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-2.5 text-xs text-rose-950 flex items-start gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-700 shrink-0 mt-0.5">
                            The Bottleneck:
                          </span>
                          <span className="font-serif leading-snug text-slate-700">
                            {era.flaw}
                          </span>
                        </div>
                      ) : null}

                      {/* Current Standard (Era 4) */}
                      {era.standard ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs text-emerald-950 flex items-start gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 shrink-0 mt-0.5">
                            Current Standard:
                          </span>
                          <span className="font-serif leading-snug text-slate-700">
                            {era.standard}
                          </span>
                        </div>
                      ) : null}

                      {/* The Breakthrough / Shift */}
                      {era.shift ? (
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 text-xs text-blue-950 flex items-start gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-700 shrink-0 mt-0.5">
                            The Shift:
                          </span>
                          <span className="font-serif leading-snug text-slate-700">
                            {era.shift}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Takeaway Box */}
              {slide.evolution.takeaway ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-xs sm:text-[13px] text-indigo-950 shadow-xs">
                  <strong className="font-sans font-bold block mb-1 text-indigo-900">
                    Why this matters today:
                  </strong>
                  <p className="font-serif m-0 leading-relaxed text-slate-800">
                    {slide.evolution.takeaway}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-white border-t border-line flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                Press Esc or click outside to dismiss
              </span>
              <button
                type="button"
                onClick={() => setIsEvolutionOpen(false)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ScaledIframe({ src, title }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      if (w > 0) {
        setScale(w < 780 ? w / 780 : 1);
      }
    }
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const baseHeight = 440;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-line bg-[#212529]"
      style={{ height: `${scale < 1 ? Math.round(baseHeight * scale) : baseHeight}px` }}
    >
      <iframe
        title={title}
        src={src}
        className="border-0 pointer-events-auto"
        style={{
          width: scale < 1 ? "780px" : "100%",
          height: `${baseHeight}px`,
          transform: scale < 1 ? `scale(${scale})` : "none",
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
