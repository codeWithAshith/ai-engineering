import { CaretDown, CaretRight, List, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Blocks, Rich } from "./Blocks.jsx";
import { EvolutionButton, EvolutionDialog } from "./EvolutionDialog.jsx";
import { PageFrame, linkFor } from "./PageFrame.jsx";
import { PromptMadLibs } from "./PromptMadLibs.jsx";
import { MessagesDemo } from "./MessagesDemo.jsx";
import { ChainDemo } from "./ChainDemo.jsx";
import { FlowDiagram } from "./FlowDiagram.jsx";
import { ToolDump } from "./ToolDump.jsx";
import { ToolLook } from "./ToolLook.jsx";
import { ToolSources } from "./ToolSources.jsx";
import { SummarizeThread } from "./SummarizeThread.jsx";
import { HumanPause } from "./HumanPause.jsx";
import { MemoryLab } from "./MemoryLab.jsx";
import { RagLab } from "./RagLab.jsx";
import { SplitterLab } from "./SplitterLab.jsx";
import { EmbeddingLab } from "./EmbeddingLab.jsx";
import { RefundCases } from "./RefundCases.jsx";
import { ResponseShape } from "./ResponseShape.jsx";
import { ReactiveLoop } from "./ReactiveLoop.jsx";
import { GraphWalk } from "./GraphWalk.jsx";
import { RagMetricsLab } from "./RagMetricsLab.jsx";
import { TermsCarousel } from "./TermsCarousel.jsx";
import { course } from "./course.js";
import { termsDeck, termsHref } from "./terms.js";

function hrefFor(item) {
  if (!item) return "#/";
  if (item.kind === "home") return "#/";
  if (item.kind === "terms") return termsHref();
  if (item.kind === "foundation") return termsHref();
  if (item.kind === "coming-soon") return "#/soon";
  if (item.kind === "section") return `#/d/${item.n || item.id.replace(/^day:/, "")}`;
  if (item.kind === "lesson") {
    return `#/l/${item.id.replace(/^lesson:/, "").split("/").map(encodeURIComponent).join("/")}`;
  }
  return "#/";
}

function parseRoute() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, "") || "");
  if (!raw) return { kind: "home" };
  if (raw === "soon" || raw.startsWith("soon/")) return { kind: "coming-soon" };
  if (raw === "words" || raw.startsWith("words/")) {
    return { kind: "terms", slide: raw.split("/")[1] || termsDeck.slides[0].id };
  }
  if (raw.startsWith("f/")) return { kind: "terms", slide: termsDeck.slides[0].id };
  if (raw.startsWith("d/")) return { kind: "section", id: `day:${raw.slice(2)}` };
  if (raw.startsWith("l/")) return { kind: "lesson", id: `lesson:${raw.slice(2)}` };
  return { kind: "home" };
}

function flattenContent() {
  const items = [
    { kind: "home", id: "home", title: "Start" },
    { kind: "terms", id: "terms", title: termsDeck.title },
  ];
  for (const section of course.sections) {
    if (section.kind === "foundations") continue;
    if (section.kind === "day") {
      items.push({ kind: "section", id: section.id, title: section.title, n: section.n, groups: section.groups });
      for (const group of section.groups) items.push(...group.items);
    }
  }
  items.push({ kind: "coming-soon", id: "coming-soon", title: "Later days" });
  return items;
}

function findItem(route) {
  if (route.kind === "home") return { kind: "home", id: "home", title: "Start" };
  if (route.kind === "coming-soon") return { kind: "coming-soon", id: "coming-soon", title: "Later days" };
  if (route.kind === "terms") {
    return { kind: "terms", id: "terms", title: termsDeck.title, slide: route.slide };
  }
  for (const section of course.sections) {
    if (route.kind === "section" && section.kind === "day" && section.id === route.id) {
      return { ...section, kind: "section" };
    }
    for (const item of section.items || []) {
      if (item.id === route.id) return item;
    }
    for (const group of section.groups || []) {
      const hit = group.items.find((it) => it.id === route.id);
      if (hit) return { ...hit, module: group.title, day: section.n, groupId: group.id };
    }
  }
  return null;
}

function moduleTitle(title) {
  return title.replace(/^\d+(?:\.\d+)?\.?\s+/, "");
}

function groupKey(sectionId, groupId) {
  return `${sectionId}:${groupId}`;
}

function findOpenGroup(item) {
  if (!item) return null;
  for (const section of course.sections) {
    for (const group of section.groups || []) {
      if (group.items.some((it) => it.id === item.id)) {
        return groupKey(section.id, group.id);
      }
    }
  }
  return null;
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function navLinkClass(active) {
  return cx(
    "block rounded-lg px-2.5 py-[7px] text-[13.5px] leading-snug no-underline transition-all",
    active
      ? "bg-blue-50 font-semibold text-blue-700 shadow-xs ring-1 ring-blue-500/10"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  );
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);
  const [menu, setMenu] = useState(false);
  const mainRef = useRef(null);
  const sequence = useMemo(() => flattenContent(), []);

  useEffect(() => {
    function onHash() {
      setRoute(parseRoute());
      setMenu(false);
      mainRef.current?.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const item = findItem(route);
  const index = sequence.findIndex((it) => it.id === (item?.id || "home"));
  const prev = index > 0 ? sequence[index - 1] : null;
  const next = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink">
      {menu ? (
        <button
          className="fixed inset-0 z-30 bg-ink/40 sm:hidden"
          type="button"
          aria-label="Close topics"
          onClick={() => setMenu(false)}
        />
      ) : null}
      <Nav route={route} item={item} open={menu} onGo={() => setMenu(false)} />
      <div ref={mainRef} className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:hidden">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink"
            type="button"
            aria-expanded={menu}
            aria-controls="topics"
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
            Topics
          </button>
          <a href="#/" className="truncate text-[15px] font-semibold tracking-tight text-ink no-underline">
            AI Engineering
          </a>
        </header>
        <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
          <Article item={item} prev={prev} next={next} />
        </main>
      </div>
    </div>
  );
}

function Nav({ route, item, open, onGo }) {
  const currentGroup = findOpenGroup(item);
  const [openGroups, setOpenGroups] = useState(() => new Set(currentGroup ? [currentGroup] : []));
  const listRef = useRef(null);

  useEffect(() => {
    if (!currentGroup) return;
    setOpenGroups((prev) => {
      if (prev.has(currentGroup)) return prev;
      const next = new Set(prev);
      next.add(currentGroup);
      return next;
    });
  }, [currentGroup]);

  useEffect(() => {
    const el = listRef.current?.querySelector("[data-active-lesson='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [route, openGroups]);

  function toggleGroup(key) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <aside
      id="topics"
      className={cx(
        "fixed inset-y-0 left-0 z-40 flex h-dvh w-[17rem] shrink-0 flex-col border-r border-line bg-surface shadow-xl transition-transform duration-200 sm:static sm:z-0 sm:translate-x-0 sm:shadow-none",
        open ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
      )}
      aria-label="Topics"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <a
          className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight text-slate-900 no-underline"
          href="#/"
          onClick={onGo}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 font-mono text-xs font-bold text-white shadow-xs">
            AI
          </span>
          AI Engineering
        </a>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-slate-100 sm:hidden"
          type="button"
          aria-label="Close topics"
          onClick={onGo}
        >
          <X size={18} weight="bold" />
        </button>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <a className={navLinkClass(route.kind === "home")} href="#/" onClick={onGo}>
          Start Course
        </a>
        <div className="mt-5">
          <p className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Foundational understanding
          </p>
          <a
            className={navLinkClass(route.kind === "terms")}
            href={termsHref()}
            onClick={onGo}
            aria-current={route.kind === "terms" ? "page" : undefined}
          >
            {termsDeck.navTitle}
          </a>
        </div>
        {course.sections.map((section) => {
          if (section.kind === "foundations") return null;
          if (section.kind === "day") {
            return (
              <div key={section.id} className="mt-5">
                <a
                  className={cx(
                    "mb-1 block rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider no-underline transition-colors",
                    route.kind === "section" && route.id === section.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-400 hover:text-slate-700",
                  )}
                  href={hrefFor({ kind: "section", n: section.n })}
                  onClick={onGo}
                >
                  {section.title}
                </a>
                {section.groups.map((group) => {
                  const key = groupKey(section.id, group.id);
                  const expanded = openGroups.has(key);
                  return (
                    <div key={group.id} className="mb-0.5">
                      <button
                        type="button"
                        className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-[7px] text-left text-[13.5px] font-medium text-slate-800 hover:bg-slate-100"
                        aria-expanded={expanded}
                        onClick={() => toggleGroup(key)}
                      >
                        {expanded ? (
                          <CaretDown size={12} weight="bold" className="shrink-0 text-slate-400" />
                        ) : (
                          <CaretRight size={12} weight="bold" className="shrink-0 text-slate-400" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{moduleTitle(group.title)}</span>
                      </button>
                      {expanded ? (
                        <div className="ml-3 border-l border-slate-200 pl-1">
                          {group.items.map((it) => (
                            <a
                              key={it.id}
                              className={navLinkClass(route.id === it.id)}
                              href={hrefFor(it)}
                              onClick={onGo}
                              aria-current={route.id === it.id ? "page" : undefined}
                              data-active-lesson={route.id === it.id || undefined}
                            >
                              {it.title}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          }
          return null;
        })}
        <div className="mt-5 pb-6">
          <p className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Later</p>
          <a className={navLinkClass(route.kind === "coming-soon")} href="#/soon" onClick={onGo}>
            Later days
          </a>
        </div>
      </div>
    </aside>
  );
}

function Article({ item, prev, next }) {
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  useEffect(() => {
    setEvolutionOpen(false);
  }, [item?.id]);
  if (!item) {
    return (
      <article className="w-full">
        <h1 className="m-0 font-sans text-[2rem] font-semibold tracking-tight text-ink">Not on the site</h1>
        <p className="mt-3 font-serif text-lg leading-relaxed text-muted">Pick another topic.</p>
      </article>
    );
  }

  if (item.kind === "home") {
    return (
      <PageFrame
        title="The class is the idea. The files are the proof."
        lede="Each page is a teaching note: why this exists, how it works, what we run in the room, and the mix-up students usually make. Python stays in the day folders."
        prev={linkFor(prev, hrefFor)}
        next={linkFor(next, hrefFor)}
      >
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-slate-400">
            Course Curriculum
          </h2>
          <ul className="m-0 list-none divide-y divide-line p-0">
            <HomeLink
              href={termsHref()}
              tag="Engineering Notes"
              title="Engineering Notes"
              detail="Foundational understanding. One concept per slide — LLM, prompt, tokens, context window, temperature, sampling, hallucination."
            />
            <HomeLink
              href="#/d/1"
              tag="Day 1"
              title="Day 1: LangChain & LangGraph Fundamentals"
              detail="From raw chat model calls to an order-support agent with state graphs and refund human-in-the-loop pauses."
            />
            <HomeLink
              href="#/d/2"
              tag="Day 2"
              title="Day 2: Context Engineering & RAG Systems"
              detail="Fitting token windows, trimming noisy messages, long-term memory stores, and grounded retrieval over enterprise policies."
            />
            <HomeLink
              href="#/d/3"
              tag="Day 3"
              title="Day 3: Advanced RAG & Agentic RAG"
              detail="Measure failures first, climb the retrieval ladder (hybrid, HyDE, CRAG, adaptive routing), then the production agentic RAG capstone."
            />
            <HomeLink
              href="#/d/5"
              tag="Day 5"
              title="Day 5: Advanced Agent Architecture"
              detail="Supervisors, workers, routers, critics, handoffs, shared state — and when multi-agent is worth the cost."
            />
          </ul>
        </div>
      </PageFrame>
    );
  }

  if (item.kind === "section") {
    return (
      <PageFrame
        title={item.title}
        lede="Why it exists, how it works, what we run, and the mix-ups to avoid."
        prev={linkFor(prev, hrefFor)}
        next={linkFor(next, hrefFor)}
      >
        {item.groups.map((group) => (
          <section key={group.id} className="mb-8 rounded-2xl border border-line bg-surface p-6 shadow-xs">
            <h2 className="m-0 mb-3 font-sans text-base font-bold text-slate-900">
              {moduleTitle(group.title)}
            </h2>
            <ul className="m-0 list-none divide-y divide-line p-0">
              {group.items.map((it) => (
                <li key={it.id}>
                  <a href={hrefFor(it)} className="group block py-3.5 no-underline transition-all">
                    <span className="block font-sans text-[1.05rem] font-bold text-slate-800 transition-colors group-hover:text-blue-600">
                      {it.title}
                    </span>
                    {it.learn ? (
                      <span className="mt-1 block font-serif text-[0.96rem] leading-snug text-slate-500">
                        {it.learn}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </PageFrame>
    );
  }

  if (item.kind === "coming-soon") {
    return (
      <PageFrame
        title="Days 4, 6 to 10 wait until we publish them."
        lede="This site is Engineering Notes, Day 1, Day 2, Day 3, and Day 5."
        prev={linkFor(prev, hrefFor)}
        next={linkFor(next, hrefFor)}
      />
    );
  }

  if (item.kind === "terms") {
    return (
      <TermsCarousel
        slideId={item.slide}
        edgePrev={linkFor(prev, hrefFor)}
        edgeNext={linkFor(next, hrefFor)}
      />
    );
  }

  return (
    <PageFrame
      title={item.title}
      lede={item.learn}
      actions={item.evolution ? <EvolutionButton onClick={() => setEvolutionOpen(true)} /> : null}
      prev={linkFor(prev, hrefFor)}
      next={linkFor(next, hrefFor)}
    >
      {item.demo === "prompt-mad-libs" ? <PromptMadLibs /> : null}
      {item.demo === "tool-dump" ? <ToolDump /> : null}
      {item.demo === "messages" ? <MessagesDemo /> : null}
      {item.demo === "chain" ? <ChainDemo /> : null}
      {item.demo === "tool-look" ? <ToolLook /> : null}
      {item.demo === "tool-sources" ? <ToolSources /> : null}
      {item.demo === "summarize-thread" ? <SummarizeThread /> : null}
      {item.demo === "human-pause" ? <HumanPause /> : null}
      {item.demo === "memory" ? <MemoryLab id={item.memory} /> : null}
      {item.demo === "rag" ? <RagLab id={item.rag} /> : null}
      {item.demo === "rag-metrics" ? <RagMetricsLab /> : null}
      {item.demo === "splitters" ? <SplitterLab /> : null}
      {item.demo === "embedding" ? <EmbeddingLab /> : null}
      {item.demo === "refund-cases" ? <RefundCases /> : null}
      {item.demo === "response-shape" ? <ResponseShape /> : null}
      {item.demo === "reactive-loop" ? <ReactiveLoop /> : null}
      {item.demo === "graph" || item.graph ? <GraphWalk id={item.graph} /> : null}
      <FlowDiagram diagram={item.diagram} />
      {item.notes?.length ? (
        <div className="mb-5 rounded-xl border border-line bg-surface p-4 shadow-xs">
          <ul className="m-0 list-none space-y-2.5 pl-0 font-serif text-[1.05rem] leading-relaxed text-slate-800">
            {item.notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                <span><Rich text={note} /></span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Blocks blocks={item.blocks} />
      {item.snippet ? (
        <div className="mb-5">
          <p className="m-0 mb-2 font-sans text-xs font-bold uppercase tracking-wider text-slate-400">The line that matters</p>
          <pre className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900 p-4 font-mono text-[0.88rem] leading-relaxed text-slate-100 shadow-sm"><code>{item.snippet}</code></pre>
        </div>
      ) : null}
      {item.sample ? (
        <div className="mb-5">
          <p className="m-0 mb-2 font-sans text-xs font-bold uppercase tracking-wider text-slate-400">What the room should see</p>
          <pre className="overflow-x-auto rounded-xl border border-line bg-paper p-4 font-mono text-[0.88rem] leading-relaxed text-slate-800"><code>{item.sample}</code></pre>
        </div>
      ) : null}
      <EvolutionDialog evolution={item.evolution} open={evolutionOpen} onClose={() => setEvolutionOpen(false)} />
    </PageFrame>
  );
}

function HomeLink({ href, title, detail, tag }) {
  return (
    <li>
      <a href={href} className="group block py-4 no-underline transition-all">
        <div className="flex items-center gap-2">
          {tag ? (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
              {tag}
            </span>
          ) : null}
          <span className="font-sans text-[1.15rem] font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {title}
          </span>
        </div>
        <span className="mt-1.5 block font-serif text-[1rem] leading-relaxed text-slate-600">{detail}</span>
      </a>
    </li>
  );
}

