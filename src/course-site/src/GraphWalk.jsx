import { useEffect, useState } from "react";

const GRAPHS = {
  why: {
    caption: "A chain cannot turn around. This ticket can.",
    rows: [["START", "normalize"], ["escalate", "lookup"], ["END"]],
    plays: [
      { name: "ORD-3 cancelled", path: ["START", "normalize", "escalate", "END"], edge: "cancelled" },
      { name: "Normal order", path: ["START", "normalize", "lookup", "END"], edge: "normal" },
    ],
  },
  nodes: {
    caption: "Every ticket takes this line. A node updates the ticket. An edge always goes to the next node.",
    rows: [["START", "normalize", "enrich", "END"]],
    plays: [{ name: "ORD-1", path: ["START", "normalize", "enrich", "END"], edge: "fixed edge" }],
  },
  conditional: {
    caption: "classify reads the ticket and the edge picks the desk.",
    rows: [["START", "classify"], ["vip", "standard"], ["END"]],
    plays: [
      { name: "Priority high", path: ["START", "classify", "vip", "END"], edge: "priority high" },
      { name: "Everyone else", path: ["START", "classify", "standard", "END"], edge: "else" },
    ],
  },
  routing: {
    caption: "The routing node writes the desk onto the ticket. The edge only reads it.",
    rows: [["START", "classify"], ["order_desk", "product_desk", "chitchat"], ["END"]],
    plays: [
      { name: "Order", path: ["START", "classify", "order_desk", "END"], edge: "order" },
      { name: "Product", path: ["START", "classify", "product_desk", "END"], edge: "product" },
      { name: "Other", path: ["START", "classify", "chitchat", "END"], edge: "other" },
    ],
  },
  reducers: {
    caption: "Same line of nodes. The reducer decides whether a field is replaced or appended.",
    rows: [["START", "normalize", "enrich", "END"]],
    plays: [{ name: "ORD-1", path: ["START", "normalize", "enrich", "END"], edge: "partial update" }],
  },
  loop: {
    caption: "The model either calls a tool or stops. The tool comes back to the model.",
    rows: [["START", "chatbot", "tools"], ["give_up", "END"]],
    plays: [
      { name: "Tool, then done", path: ["START", "chatbot", "tools", "chatbot", "END"], edge: "tool result comes back" },
      { name: "Retries used up", path: ["START", "chatbot", "tools", "give_up", "END"], edge: "retry limit" },
    ],
  },
  parallel: {
    caption: "normalize and check_tier both start. merge waits for both.",
    rows: [["START"], ["normalize", "check_tier"], ["merge", "END"]],
    plays: [{ name: "Both checks", path: ["START", "normalize", "check_tier", "merge", "END"], edge: "fan out, then join" }],
  },
  streaming: {
    caption: "One node. stream shows the reply while it is still being written. invoke waits until END.",
    rows: [["START", "chatbot", "END"]],
    plays: [{ name: "ORD-1", path: ["START", "chatbot", "END"], edge: "tokens, then the finished ticket" }],
  },
  thinking: {
    caption: "updates says which node ran. messages is the answer text. Both are on one stream.",
    rows: [["START", "chatbot", "tools", "END"]],
    plays: [{ name: "Lookup", path: ["START", "chatbot", "tools", "chatbot", "END"], edge: "tool, then tokens" }],
  },
  persistence: {
    caption: "After chatbot, the checkpointer keeps the ticket under a thread id. The next turn starts from that snapshot.",
    rows: [["START", "chatbot", "END"]],
    plays: [{ name: "thread ord-1", path: ["START", "chatbot", "END"], edge: "checkpoint saved" }],
  },
  config: {
    caption: "The same loop, with a step cap and metadata riding on the run.",
    rows: [["START", "chatbot", "tools", "END"]],
    plays: [{ name: "One lookup", path: ["START", "chatbot", "tools", "chatbot", "END"], edge: "recursion_limit on the run" }],
  },
  durable: {
    caption: "Same chatbot. The snapshot is written to SQLite, so a restart can resume the thread.",
    rows: [["START", "chatbot", "END"]],
    plays: [{ name: "After restart", path: ["START", "chatbot", "END"], edge: "SQLite still has the thread" }],
  },
  state: {
    caption: "Pause on the checkpoint. Read it, change a field, then resume without sending the question again.",
    rows: [["invoke", "checkpoint", "get_state", "update_state", "resume"]],
    plays: [{ name: "Fix the id", path: ["invoke", "checkpoint", "get_state", "update_state", "resume"], edge: "order id corrected" }],
  },
  subgraph: {
    caption: "lookup is a whole graph used as one node. The parent only sees it finish.",
    rows: [["START", "normalize", "lookup", "format_note", "END"]],
    plays: [{ name: "Refund desk", path: ["START", "normalize", "lookup", "format_note", "END"], edge: "lookup is a subgraph" }],
  },
  mapreduce: {
    caption: "plan sends one branch per order. reduce joins them.",
    rows: [["START", "plan"], ["work"], ["reduce", "END"]],
    plays: [{ name: "ORD-1 and ORD-2", path: ["START", "plan", "work", "reduce", "END"], edge: "Send per order" }],
  },
};

export function GraphWalk({ id }) {
  const graph = GRAPHS[id];
  const [play, setPlay] = useState(0);
  const [step, setStep] = useState(0);
  const scenario = graph?.plays[play];

  useEffect(() => {
    setStep(0);
  }, [play, id]);

  useEffect(() => {
    if (!scenario) return undefined;
    const timer = setInterval(() => {
      setStep((n) => (n + 1) % scenario.path.length);
    }, 1100);
    return () => clearInterval(timer);
  }, [scenario]);

  if (!graph || !scenario) return null;
  const active = scenario.path[step];
  const prev = step > 0 ? scenario.path[step - 1] : null;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">Watch the ticket move</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">{graph.caption}</p>
      {graph.plays.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {graph.plays.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setPlay(i)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 font-sans text-sm ${
                i === play ? "border-teal-300 bg-teal-400 font-semibold text-slate-950" : "border-slate-600 bg-slate-900 text-slate-300"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {graph.rows.map((row) => (
          <div key={row.join("-")} className="flex flex-wrap justify-center gap-2">
            {row.map((node) => {
              const on = node === active;
              const seen = scenario.path.slice(0, step).includes(node);
              return (
                <div
                  key={node}
                  className={`min-w-[7.5rem] rounded-xl border px-3 py-3 text-center transition-colors duration-500 ${
                    on
                      ? "border-teal-300 bg-teal-400 text-slate-950"
                      : seen
                        ? "border-slate-500 bg-slate-800 text-slate-100"
                        : "border-dashed border-slate-700 bg-slate-900 text-slate-500"
                  }`}
                >
                  <p className="m-0 font-mono text-xs font-bold uppercase tracking-wider">{node}</p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="m-0 mt-4 font-serif text-sm text-slate-300">
        {prev ? `${prev} → ${active}` : active}
        <span className="text-amber-200"> · {scenario.edge}</span>
      </p>
    </div>
  );
}
