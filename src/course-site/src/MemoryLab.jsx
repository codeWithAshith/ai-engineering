import { useEffect, useState } from "react";

function useWalk(length, resetKey) {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [seenKey, setSeenKey] = useState(resetKey);

  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setStep(-1);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || !length) return undefined;
    const timer = setInterval(() => {
      setStep((current) => {
        const next = current < 0 ? 0 : current + 1;
        if (next >= length) {
          setPlaying(false);
          return length - 1;
        }
        return next;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [playing, length]);

  return { step, setStep, playing, setPlaying };
}

function Shell({ kicker, caption, cases, caseIdx, setCaseIdx, step, setStep, playing, setPlaying, children, note }) {
  const walkLength = cases[caseIdx].steps.length;
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">{kicker}</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">{caption}</p>
      {cases.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {cases.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setCaseIdx(index)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 font-sans text-xs font-semibold ${
                index === caseIdx
                  ? "border-teal-400 bg-teal-400 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">{children}</div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setPlaying(true);
          }}
          className="cursor-pointer rounded-lg border border-teal-400 bg-teal-400 px-3 py-1.5 font-sans text-xs font-semibold text-slate-950"
        >
          Play
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStep((current) => Math.max(0, current < 0 ? 0 : current - 1));
          }}
          className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200"
        >
          Step back
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStep((current) => Math.min(walkLength - 1, current < 0 ? 0 : current + 1));
          }}
          className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200"
        >
          Step
        </button>
        <span className="font-mono text-[11px] text-slate-500">
          {step < 0 ? "press Play" : `${step + 1} / ${walkLength}`}
        </span>
      </div>
      <p className="m-0 mt-3 rounded-xl border border-teal-900/40 bg-teal-950/30 px-3.5 py-2.5 font-serif text-sm text-teal-100">
        {note}
      </p>
    </div>
  );
}

function Rows({ rows, hot }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => {
        const on = hot?.includes(row.id);
        return (
          <div
            key={row.id}
            className={`rounded-lg border px-3 py-2 ${on ? "border-teal-400 bg-teal-400/15" : "border-slate-800 bg-slate-950"}`}
          >
            <p className="m-0 font-sans text-[10px] font-bold uppercase tracking-wider text-teal-300">{row.label}</p>
            <p className="m-0 mt-1 font-mono text-[12px] leading-relaxed text-slate-100">{row.value}</p>
          </div>
        );
      })}
    </div>
  );
}

const LABS = {
  why: {
    kicker: "01 · Graph and long-term memory",
    caption: "The checkpoint is this thread. The Store is the fact that outlives it.",
    cases: [
      {
        name: "this thread",
        steps: [
          {
            note: "The graph holds the ORD-1 chat. That is Day 1 persistence: one thread_id.",
            hot: ["graph"],
            rows: [
              { id: "graph", label: "Graph · thread support-A", value: "Where is ORD-1? → shipped" },
              { id: "store", label: "Store · customers / cust-42", value: "empty" },
            ],
          },
          {
            note: "A node reads the Store into this run. The fact is not a field on graph state.",
            hot: ["store", "graph"],
            rows: [
              { id: "graph", label: "Graph · thread support-A", value: "messages + contact from the Store" },
              { id: "store", label: "Store · customers / cust-42", value: "contact = email" },
            ],
          },
          {
            note: "The node writes a fact back. The next thread can read it. The chat does not have to be copied.",
            hot: ["store"],
            rows: [
              { id: "graph", label: "Graph · thread support-A", value: "still just this chat" },
              { id: "store", label: "Store · customers / cust-42", value: "contact = email" },
            ],
          },
        ],
      },
      {
        name: "new thread",
        steps: [
          {
            note: "A new thread_id starts with an empty checkpoint. The ORD-1 chat is gone.",
            hot: ["graph"],
            rows: [
              { id: "graph", label: "Graph · thread support-B", value: "no messages yet" },
              { id: "store", label: "Store · customers / cust-42", value: "contact = email" },
            ],
          },
          {
            note: "The Store did not reset. The new run can still load email.",
            hot: ["store"],
            rows: [
              { id: "graph", label: "Graph · thread support-B", value: "How do we reach them?" },
              { id: "store", label: "Store · customers / cust-42", value: "contact = email" },
            ],
          },
        ],
      },
    ],
  },
  trim: {
    kicker: "02 · Trim",
    caption: "trim_messages returns a shorter copy. The history list does not change.",
    cases: [
      {
        name: "last 80",
        steps: [
          {
            note: "The thread is the system line plus Follow-up 0 through 5. Nothing has been cut yet.",
            hot: ["full"],
            rows: [
              { id: "full", label: "full thread", value: "13 messages · Follow-up 0 … Follow-up 5" },
            ],
          },
          {
            note: "strategy last, max 80 tokens, start_on human. The copy opens on a person. The system line is left out.",
            hot: ["sent"],
            rows: [
              { id: "sent", label: "copy", value: "Follow-up 4 and 5" },
              { id: "kept", label: "history", value: "still 13 messages" },
            ],
          },
        ],
      },
      {
        name: "keep system",
        steps: [
          {
            note: "Same 80-token budget. include_system keeps the support line even when it sits outside the window.",
            hot: ["sys", "tail"],
            rows: [
              { id: "sys", label: "system", value: "You are order support. Be brief." },
              { id: "tail", label: "then", value: "the newest Follow-ups that still fit" },
            ],
          },
        ],
      },
      {
        name: "first 80",
        steps: [
          {
            note: "strategy first keeps the old opening. You do not get the latest update.",
            hot: ["old"],
            rows: [
              { id: "old", label: "copy", value: "system line, then Follow-up 0" },
              { id: "miss", label: "not in the copy", value: "Follow-up 5" },
            ],
          },
        ],
      },
      {
        name: "last 4",
        steps: [
          {
            note: "token_counter is len. max_tokens 4 means four messages, not four tokens. start_on human still applies.",
            hot: ["four"],
            rows: [
              { id: "four", label: "copy", value: "the last four messages" },
              { id: "disk", label: "history", value: "unchanged" },
            ],
          },
        ],
      },
    ],
  },
  store: {
    kicker: "04 · Store",
    caption: "put writes a namespaced fact. A new thread_id reads it with the same store.",
    cases: [
      {
        name: "two threads",
        steps: [
          {
            note: "Thread A asks to be emailed. The tool calls store.put on customers / cust-42.",
            hot: ["a", "store"],
            rows: [
              { id: "a", label: "thread support-A", value: "Save contact=email" },
              { id: "store", label: "Store", value: "contact = email" },
              { id: "b", label: "thread support-B", value: "not started" },
            ],
          },
          {
            note: "Thread B has no chat history. get_prefs still finds email, because the Store is not the checkpoint.",
            hot: ["b", "store"],
            rows: [
              { id: "a", label: "thread support-A", value: "saved contact=email" },
              { id: "store", label: "Store", value: "contact = email" },
              { id: "b", label: "thread support-B", value: "What is saved? → email" },
            ],
          },
        ],
      },
    ],
  },
  semantic: {
    kicker: "05 · Semantic memory",
    caption: "The fact is the memory. search ranks it by the question, not by the key name.",
    cases: [
      {
        name: "reach them",
        steps: [
          {
            note: "Two facts sit in the Store. Neither key is the question.",
            hot: ["contact", "ship"],
            rows: [
              { id: "contact", label: "key contact", value: "Contact by email. Do not call." },
              { id: "ship", label: "key shipping", value: "Last order ORD-1 has shipped." },
            ],
          },
          {
            note: "“Do we call this customer or email them?” is closest to the contact fact.",
            hot: ["contact"],
            rows: [
              { id: "q", label: "query", value: "Do we call this customer or email them?" },
              { id: "contact", label: "hit", value: "Contact by email. Do not call." },
              { id: "ship", label: "not chosen", value: "Last order ORD-1 has shipped." },
            ],
          },
        ],
      },
    ],
  },
  episodic: {
    kicker: "06 · Episodic memory",
    caption: "An episode is one case: situation, action, outcome. Search returns the closest past ticket.",
    cases: [
      {
        name: "late package",
        steps: [
          {
            note: "Two short cases. Not the old transcripts.",
            hot: ["tkt-42", "tkt-18"],
            rows: [
              { id: "tkt-42", label: "tkt-42", value: "Late ORD-1. Refunded. Customer satisfied." },
              { id: "tkt-18", label: "tkt-18", value: "Wrong address on ORD-9. Resent." },
            ],
          },
          {
            note: "A late shipment should find tkt-42. Semantic memory would only have said “email them.”",
            hot: ["tkt-42"],
            rows: [
              { id: "q", label: "query", value: "Package is late. What did we do last time?" },
              { id: "tkt-42", label: "hit", value: "Late ORD-1. Refunded. Customer satisfied." },
              { id: "tkt-18", label: "not chosen", value: "Wrong address on ORD-9. Resent." },
            ],
          },
        ],
      },
    ],
  },
  procedural: {
    kicker: "07 · Procedural memory",
    caption: "The Store holds the instruction. The next system prompt is built from that line.",
    cases: [
      {
        name: "late shipment",
        steps: [
          {
            note: "The standing rule is still the greeting. A bad late-order reply has not changed behavior yet.",
            hot: ["rule"],
            rows: [
              { id: "rule", label: "Store · late-shipment", value: "Greet the customer, then look up the order." },
              { id: "prompt", label: "Next system prompt", value: "Standing rule: greet, then look up." },
            ],
          },
          {
            note: "put replaces the rule. The thread does not get longer. The next ticket loads the new instruction.",
            hot: ["rule", "prompt"],
            rows: [
              { id: "rule", label: "Store · late-shipment", value: "When a shipment is late, offer the refund first." },
              { id: "prompt", label: "Next system prompt", value: "Standing rule: offer the refund before asking them to wait." },
            ],
          },
        ],
      },
    ],
  },
  backends: {
    kicker: "08 · Production backends",
    caption: "Same put and same checkpointer call. Postgres keeps them after the process stops.",
    cases: [
      {
        name: "restart",
        steps: [
          {
            note: "In memory, contact=email and thread ord-1 both exist while the process is up.",
            hot: ["mem", "pg"],
            rows: [
              { id: "mem", label: "InMemoryStore + MemorySaver", value: "contact=email · thread ord-1" },
              { id: "pg", label: "PostgresStore + PostgresSaver", value: "contact=email · thread ord-1" },
            ],
          },
          {
            note: "Restart the process. The in-memory pair is gone. Postgres still has the fact and the thread.",
            hot: ["pg"],
            rows: [
              { id: "mem", label: "InMemoryStore + MemorySaver", value: "empty" },
              { id: "pg", label: "PostgresStore + PostgresSaver", value: "contact=email · thread ord-1" },
            ],
          },
        ],
      },
    ],
  },
  growth: {
    kicker: "09 · Saver, summary, and store",
    caption: "One agent. The thread is summarized. Old tool dumps are cleared. The preference stays in the Store.",
    cases: [
      {
        name: "one agent",
        steps: [
          {
            note: "MemorySaver keeps this chat under thread support-growth.",
            hot: ["saver"],
            rows: [
              { id: "saver", label: "Saver", value: "thread support-growth" },
              { id: "summary", label: "Summary", value: "not yet · trigger is 8 messages" },
              { id: "store", label: "Store", value: "empty" },
            ],
          },
          {
            note: "save_pref writes contact=email. A later thread can read it. The chat does not have to be copied.",
            hot: ["store"],
            rows: [
              { id: "saver", label: "Saver", value: "this chat" },
              { id: "summary", label: "Summary", value: "after 8 messages, keep the last 4" },
              { id: "store", label: "Store", value: "contact = email" },
            ],
          },
          {
            note: "ClearToolUsesEdit drops old tool results past 2000 tokens and keeps the two newest. Clearing a lookup does not delete the stored preference.",
            hot: ["tools", "store"],
            rows: [
              { id: "tools", label: "Old tool results", value: "[old tool result cleared]" },
              { id: "store", label: "Store", value: "contact = email" },
            ],
          },
        ],
      },
    ],
  },
};

export function MemoryLab({ id }) {
  const spec = LABS[id];
  const [caseIdx, setCaseIdx] = useState(0);
  const [seenId, setSeenId] = useState(id);
  if (seenId !== id) {
    setSeenId(id);
    setCaseIdx(0);
  }
  const steps = spec?.cases[caseIdx]?.steps || [];
  const { step, setStep, playing, setPlaying } = useWalk(steps.length, `${id}-${caseIdx}`);
  if (!spec) return null;
  const beat = step >= 0 ? steps[step] : steps[0];
  return (
    <Shell
      kicker={spec.kicker}
      caption={spec.caption}
      cases={spec.cases}
      caseIdx={caseIdx}
      setCaseIdx={setCaseIdx}
      step={step}
      setStep={setStep}
      playing={playing}
      setPlaying={setPlaying}
      note={step < 0 ? "Press Play. Switch the case when there are two." : beat.note}
    >
      <Rows rows={beat.rows} hot={step < 0 ? [] : beat.hot} />
    </Shell>
  );
}
