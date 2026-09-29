import { useEffect, useState } from "react";

let mermaidSeq = 0;

function specToMermaid(spec) {
  if (!spec) return "";
  const names = [];
  const add = (name) => {
    if (name && !names.includes(name)) names.push(name);
  };
  (spec.layers || []).forEach((layer) => layer.forEach(add));
  (spec.edges || []).forEach((edge) => {
    add(edge.from);
    add(edge.to);
  });
  (spec.backEdges || []).forEach((edge) => {
    add(edge.from);
    add(edge.to);
  });
  if (!names.length) return "";
  const idOf = (name) => `n_${names.indexOf(name)}`;
  const dir = spec.direction === "LR" ? "LR" : "TD";
  const lines = [`flowchart ${dir}`];
  names.forEach((name) => {
    const label = String(name).replace(/"/g, "'");
    lines.push(name === "START" || name === "END" ? `  ${idOf(name)}(["${label}"])` : `  ${idOf(name)}["${label}"]`);
  });
  const write = (edge, dotted) => {
    const arrow = dotted ? "-.->" : "-->";
    const label = edge.label ? `|${String(edge.label).replace(/\|/g, "/")}|` : "";
    lines.push(`  ${idOf(edge.from)} ${arrow}${label} ${idOf(edge.to)}`);
  };
  (spec.edges || []).forEach((edge) => write(edge, false));
  (spec.backEdges || []).forEach((edge) => write(edge, true));
  return lines.join("\n");
}

function MermaidDiagram({ spec }) {
  const text = specToMermaid(spec);
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!text) return undefined;
    let cancelled = false;
    const id = `mmd_${(mermaidSeq += 1)}`;
    import("mermaid")
      .then(({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
          fontFamily: "ui-monospace, monospace",
        });
        return mermaid.render(id, text);
      })
      .then((out) => {
        if (!cancelled) {
          setErr("");
          setSvg(out.svg);
        }
      })
      .catch((error) => {
        if (!cancelled) setErr(String(error?.message || error));
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!text) return null;
  return (
    <details className="mt-4 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
      <summary className="cursor-pointer font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Mermaid
      </summary>
      {err ? <p className="mt-2 font-mono text-xs text-red-300">{err}</p> : null}
      {svg ? (
        <div className="mt-2 overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : null}
    </details>
  );
}

const DIAGRAMS = {
  why: { kind: "why" },
  nodes: {
    kicker: "02 · Nodes and edges",
    caption: "A node is a function of state. A fixed edge always runs next.",
    direction: "LR",
    layers: [["START"], ["normalize"], ["enrich"], ["END"]],
    edges: [
      { from: "START", to: "normalize" },
      { from: "normalize", to: "enrich" },
      { from: "enrich", to: "END" },
    ],
    meanings: {
      START: "entry",
      normalize: "strip / upper the order id",
      enrich: "look up status, write a note",
      END: "exit",
    },
    walk: [
      { nodes: ["START"], edges: [], note: "Ticket enters. Every ticket takes this same path.", ticket: { order_id: " ord-1 " } },
      { nodes: ["START", "normalize"], edges: [{ from: "START", to: "normalize" }], note: "normalize returns only the fields it changes.", ticket: { order_id: "ORD-1" } },
      { nodes: ["START", "normalize", "enrich"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "enrich" }], note: "enrich looks up ORD-1. Still no branch.", ticket: { order_id: "ORD-1", status: "shipped", note: "ORD-1 is currently shipped" } },
      { nodes: ["START", "normalize", "enrich", "END"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "enrich" }, { from: "enrich", to: "END" }], note: "END. Next lesson is the branch: VIP vs standard.", ticket: { order_id: "ORD-1", status: "shipped", note: "ORD-1 is currently shipped" } },
    ],
  },
  conditional: {
    kicker: "03 · Conditional edges",
    caption: "route() returns the next node name. The if/else lives on the edge.",
    direction: "TD",
    layers: [["START"], ["classify"], ["vip", "standard"], ["END"]],
    edges: [
      { from: "START", to: "classify" },
      { from: "classify", to: "vip", label: "priority high" },
      { from: "classify", to: "standard", label: "else" },
      { from: "vip", to: "END" },
      { from: "standard", to: "END" },
    ],
    meanings: {
      START: "entry",
      classify: "prep. route() picks the desk",
      vip: "VIP desk",
      standard: "standard desk",
      END: "exit",
    },
    cases: [
      {
        name: "priority high",
        walk: [
          { nodes: ["START"], edges: [], note: "ORD-1 arrives with priority high.", ticket: { order_id: "ORD-1", priority: "high" } },
          { nodes: ["START", "classify"], edges: [{ from: "START", to: "classify" }], note: "classify runs. route() reads priority — not stored as a new field.", ticket: { order_id: "ORD-1", priority: "high" } },
          { nodes: ["START", "classify", "vip"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "vip" }], note: "route() returns vip. standard stays on the graph; it does not run.", ticket: { order_id: "ORD-1", priority: "high", desk: "VIP desk: ORD-1 → shipped" } },
          { nodes: ["START", "classify", "vip", "END"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "vip" }, { from: "vip", to: "END" }], note: "Done. The choice is not in state — hard to log later.", ticket: { order_id: "ORD-1", priority: "high", desk: "VIP desk: ORD-1 → shipped" } },
        ],
      },
      {
        name: "else",
        walk: [
          { nodes: ["START"], edges: [], note: "ORD-2 arrives with normal priority.", ticket: { order_id: "ORD-2", priority: "normal" } },
          { nodes: ["START", "classify"], edges: [{ from: "START", to: "classify" }], note: "Same classify node. route() still decides on the edge.", ticket: { order_id: "ORD-2", priority: "normal" } },
          { nodes: ["START", "classify", "standard"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "standard" }], note: "route() returns standard. vip does not run.", ticket: { order_id: "ORD-2", priority: "normal", desk: "Standard desk: ORD-2 → pending" } },
          { nodes: ["START", "classify", "standard", "END"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "standard" }, { from: "standard", to: "END" }], note: "Same graph, other edge.", ticket: { order_id: "ORD-2", priority: "normal", desk: "Standard desk: ORD-2 → pending" } },
        ],
      },
    ],
  },
  routing: {
    kicker: "04 · Routing nodes",
    caption: "classify writes intent into state. The edge only reads that field. The table is how you pick the pattern.",
    compareTable: {
      title: "When to use which",
      headers: ["Metric", "Pure conditional edge", "Routing node + thin edge"],
      rows: [
        ["Where logic lives", "Inside the edge function (route)", "Inside a worker node (classify)"],
        ["State footprint", "No change. State is only read, not updated.", "State is updated. Saves the decision (intent) to state."],
        ["Auditability & logging", "Harder. The decision disappears once the transition occurs.", "Easy. The routing choice remains in the state history."],
        ["Downstream reuse", "Low. Later nodes cannot see why this path was taken.", "High. Downstream nodes can read state[\"intent\"] to alter their behavior."],
        ["Edge complexity", "Thick. Contains the core business or LLM classification logic.", "Thin. Simply reads a pre-computed value (return state[\"intent\"])."],
      ],
    },
    direction: "TD",
    layers: [["START"], ["classify"], ["order", "product", "other"], ["END"]],
    edges: [
      { from: "START", to: "classify" },
      { from: "classify", to: "order", label: "order" },
      { from: "classify", to: "product", label: "product" },
      { from: "classify", to: "other", label: "other" },
      { from: "order", to: "END" },
      { from: "product", to: "END" },
      { from: "other", to: "END" },
    ],
    meanings: {
      START: "entry",
      classify: "routing node — writes intent",
      order: "order desk",
      product: "product desk",
      other: "chitchat",
      END: "exit",
    },
    cases: [
      {
        name: "order",
        walk: [
          { nodes: ["START"], edges: [], note: "Question: Status of ORD-1?", ticket: { question: "Status of ORD-1?" } },
          { nodes: ["START", "classify"], edges: [{ from: "START", to: "classify" }], note: "classify stores intent=order on the ticket.", ticket: { question: "Status of ORD-1?", intent: "order" } },
          { nodes: ["START", "classify", "order"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "order" }], note: "Thin edge: return state['intent']. product and other stay on the graph.", ticket: { question: "Status of ORD-1?", intent: "order", answer: "Order desk: ORD-1 → shipped" } },
          { nodes: ["START", "classify", "order", "END"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "order" }, { from: "order", to: "END" }], note: "You can log intent because it lives on the ticket.", ticket: { question: "Status of ORD-1?", intent: "order", answer: "Order desk: ORD-1 → shipped" } },
        ],
      },
      {
        name: "product",
        walk: [
          { nodes: ["START"], edges: [], note: "Question: Is the Mouse in stock?", ticket: { question: "Is the Mouse in stock?" } },
          { nodes: ["START", "classify"], edges: [{ from: "START", to: "classify" }], note: "classify stores intent=product.", ticket: { question: "Is the Mouse in stock?", intent: "product" } },
          { nodes: ["START", "classify", "product"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "product" }], note: "Edge only reads intent. No if/else on the edge.", ticket: { question: "Is the Mouse in stock?", intent: "product", answer: "Product desk: check catalog stock." } },
          { nodes: ["START", "classify", "product", "END"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "product" }, { from: "product", to: "END" }], note: "Done.", ticket: { question: "Is the Mouse in stock?", intent: "product", answer: "Product desk: check catalog stock." } },
        ],
      },
      {
        name: "other",
        walk: [
          { nodes: ["START"], edges: [], note: "Question: Hello!", ticket: { question: "Hello!" } },
          { nodes: ["START", "classify"], edges: [{ from: "START", to: "classify" }], note: "classify stores intent=other.", ticket: { question: "Hello!", intent: "other" } },
          { nodes: ["START", "classify", "other"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "other" }], note: "Same classify node. Third desk.", ticket: { question: "Hello!", intent: "other", answer: "Happy to help with orders or products." } },
          { nodes: ["START", "classify", "other", "END"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "other" }, { from: "other", to: "END" }], note: "Done.", ticket: { question: "Hello!", intent: "other", answer: "Happy to help with orders or products." } },
        ],
      },
    ],
  },
  reducers: { kind: "reducers" },
  toolnode: {
    kicker: "06 · ToolNode",
    caption: "ToolNode is the executor you wrote by hand. It runs tool_calls. This is one round — not the agent loop.",
    compareTable: {
      title: "This lesson vs the next",
      highlight: 1,
      headers: ["Metric", "Tool node pattern", "Agent loop pattern"],
      rows: [
        ["Control flow", "Deterministic. The graph dictates when a tool runs based on pre-defined edges.", "Dynamic. The LLM decides if, when, and which tools to call sequentially."],
        ["LLM responsibility", "Low. The LLM only generates the arguments; the graph executes it.", "High. The LLM must reason, call tools, inspect outputs, and decide to stop."],
        ["State mutation", "Linear. Updates state attributes sequentially.", "Cyclic. Appends new tool logs to a message history array iteratively."],
        ["Best used for", "Structured, predictable workflows (extract text, then query the database).", "Open-ended problem solving (research this topic, then summarize)."],
      ],
    },
    direction: "LR",
    layers: [["START"], ["chatbot"], ["tools"], ["END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools" },
      { from: "tools", to: "END" },
    ],
    meanings: {
      START: "Status of ORD-1?",
      chatbot: "emits tool_calls",
      tools: "ToolNode · runs lookup_order",
      END: "ToolMessage on the ticket",
    },
    walk: [
      { nodes: ["START"], edges: [], note: "Tool Calling: bind_tools returned a call. You ran lookup_order.invoke and built a ToolMessage. That glue is a desk.", ticket: { question: "Status of ORD-1?" } },
      { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "chatbot is still just the model. It writes tool_calls. It does not run Python.", ticket: { tool_calls: "lookup_order(ORD-1)" } },
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "ToolNode reads those calls, runs lookup_order, appends ToolMessage. create_agent uses this same node.", ticket: { tool: "shipped" } },
      { nodes: ["START", "chatbot", "tools", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }, { from: "tools", to: "END" }], note: "END. No edge back to chatbot. Next lesson closes that loop: chatbot ↔ ToolNode, tools_condition as the stop.", ticket: { next: "agent loops" } },
    ],
  },
  loop: { kind: "loop" },
  parallel: {
    kicker: "08 · Parallel fixed edges",
    caption: "Merge waits. The fast branch does not start merge early. The slow one does not get skipped.",
    compareTable: {
      title: "Both edges into merge = a join",
      highlight: 1,
      headers: ["If this happens", "What LangGraph does"],
      rows: [
        ["normalize finishes first", "merge does not run. check_tier is still going."],
        ["check_tier finishes first", "merge does not run. normalize is still going."],
        ["both have finished", "merge runs once. The slow branch was not skipped."],
      ],
    },
    direction: "TD",
    layers: [["START"], ["normalize", "check_tier"], ["merge"], ["END"]],
    edges: [
      { from: "START", to: "normalize" },
      { from: "START", to: "check_tier" },
      { from: "normalize", to: "merge" },
      { from: "check_tier", to: "merge" },
      { from: "merge", to: "END" },
    ],
    meanings: {
      START: "two edges leave here",
      normalize: "branch 1 · order id",
      check_tier: "branch 2 · VIP / standard",
      merge: "waits for both",
      END: "exit",
    },
    idleNote: "Both leave START together. merge is a join — it waits. Press Play.",
    walk: [
      { nodes: ["START"], edges: [], note: "Two add_edge from START. normalize and check_tier leave at the same time. Not A then B." },
      { nodes: ["START", "normalize", "check_tier"], edges: [{ from: "START", to: "normalize" }, { from: "START", to: "check_tier" }], note: "Both have an edge into merge. Branches do not see each other's writes. check_tier still uses the raw order_id." },
      { nodes: ["START", "normalize", "check_tier"], edges: [{ from: "START", to: "normalize" }, { from: "START", to: "check_tier" }], note: "Suppose normalize finishes first. merge does not start early. The slow branch is not skipped." },
      { nodes: ["START", "normalize", "check_tier", "merge"], edges: [{ from: "START", to: "normalize" }, { from: "START", to: "check_tier" }, { from: "normalize", to: "merge" }, { from: "check_tier", to: "merge" }], note: "LangGraph treats the two edges into merge as a join: merge runs once, after both have finished." },
      { nodes: ["START", "normalize", "check_tier", "merge", "END"], edges: [{ from: "START", to: "normalize" }, { from: "START", to: "check_tier" }, { from: "normalize", to: "merge" }, { from: "check_tier", to: "merge" }, { from: "merge", to: "END" }], note: "notes concatenate with Annotated[list, add]." },
    ],
  },
  mw01: { kind: "middleware", kicker: "01 · Default middleware", caption: "The agent function stays the same. The list is the wrapper.", sits: "A sits on the tool. B and C stop the run.", table: { title: "Three guards, one list", highlight: 1, headers: ["Wrapper", "What this file does", "ORD example"], rows: [["ToolErrorMiddleware", "A raised error becomes a tool message the model can read", "ORD-999 raises → model gets ERROR"], ["ToolCallLimitMiddleware", "Stop after too many tool calls", "run_limit=1, ping twice → ToolCallLimitExceededError"], ["ModelCallLimitMiddleware", "Stop after too many model calls", "run_limit=1, lookup then reply → ModelCallLimitExceededError"]] } },
  mw02: { kind: "middleware", kicker: "02 · A person approves the write", caption: "The write waits. ORD-1 stays shipped until approve.", sits: "HumanInTheLoopMiddleware sits before update_order_status.", table: { title: "One question: set ORD-1 to delivered", highlight: 1, headers: ["Moment", "What you see"], rows: [["Before approve", "paused. ORD-1 is still shipped."], ["After approve", "The tool runs. ORD-1 is delivered."]] } },
  mw03: { kind: "middleware", kicker: "03 · Custom middleware", caption: "wrap_tool_call sits around the real tool. Log, then call the handler.", sits: "(request, handler) → handler(request) is the real tool.", table: { title: "Audit does not change the answer", highlight: 1, headers: ["Step", "ORD-1"], rows: [["Log", "lookup_order and the arguments"], ["Return", "shipped, unchanged"]] } },
  mw04: { kind: "middleware", kicker: "04 · Agent context", caption: "Context is who is calling this time. Not the chat. Not the thread.", sits: "invoke(..., context=...) then the tool reads runtime.context.", table: { title: "Three different bags", highlight: 1, headers: ["Bag", "What it is"], rows: [["messages", "The conversation"], ["checkpointer", "The thread"], ["context", "This caller: role, user id"]] } },
  mw06: { kind: "middleware", kicker: "06 · Tool governance", caption: "The role is checked when the tool runs. One agent for both roles.", sits: "wrap_tool_call reads context.role and allows or blocks.", table: { title: "Same agent, different role", highlight: 2, headers: ["Caller", "issue_refund"], rows: [["viewer", "blocked"], ["agent", "allowed"]] } },
  mw07: { kind: "middleware", kicker: "07 · Dynamic prompt", caption: "The system prompt is written for this call, before the model node.", sits: "@dynamic_prompt reads context.role and returns the prompt.", table: { title: "One agent, two prompts", highlight: 1, headers: ["Role", "Prompt says"], rows: [["agent", "You may discuss order status."], ["customer", "Do not offer to look up orders."]] } },
  mw08: { kind: "middleware", kicker: "08 · Dynamic tools", caption: "This call's context chooses which tools the model can see.", sits: "@wrap_model_call replaces request.tools, then the model runs.", table: { title: "Registered list stays. This call changes.", highlight: 1, headers: ["Role", "Tools on this call"], rows: [["agent", "lookup_order"], ["customer", "none"]] } },
  mw09: { kind: "middleware", kicker: "09 · Dynamic model", caption: "This call's context swaps request.model. The branch is the lesson.", sits: "@wrap_model_call overrides model, then the model runs.", table: { title: "Same Groq model, two names", highlight: 1, headers: ["Role", "What prints"], rows: [["viewer", "viewer -> that model name"], ["agent", "agent -> that model name"]] } },
  mw10: { kind: "middleware", kicker: "10 · Dynamic messages", caption: "The thread keeps the email. Only a viewer is sent the latest message.", sits: "@wrap_model_call trims when role is viewer.", table: { title: "Same two messages. Role decides.", highlight: 1, headers: ["Role", "Sent to the model"], rows: [["viewer", "Latest question only. Does not know the email."], ["agent", "Both messages. Can quote ada@example.com."]] } },
  mw11: { kind: "middleware", kicker: "11 · Tool retry", caption: "A named tool is tried again after a timeout. A refund is not in that list.", sits: "ToolRetryMiddleware wraps lookup_order only.", table: { title: "First call fails. Second call is the retry.", highlight: 1, headers: ["Call", "lookup_order"], rows: [["1", "TimeoutError"], ["2", "ORD-1 shipped"]] } },
  mw12: { kind: "middleware", kicker: "12 · PII redaction", caption: "The email is redacted before the model sees the message.", sits: "PIIMiddleware on the input. strategy redact.", table: { title: "The model can only quote what it saw", highlight: 1, headers: ["Side", "Text"], rows: [["You typed", "ada@example.com"], ["Model saw", "the redacted form"]] } },
  mw13: { kind: "middleware", kicker: "13 · Model fallback", caption: "The first model name fails. The same turn runs on the fallback.", sits: "ModelFallbackMiddleware swaps in the Groq model.", table: { title: "One invoke, two model names", highlight: 1, headers: ["Name", "What happens"], rows: [["groq:model-that-does-not-exist", "Fails"], ["groq:openai/gpt-oss-20b", "Replies: ready"]] } },
  mw14: { kind: "middleware", kicker: "14 · Tool selector", caption: "Four tools are registered. This question keeps one.", sits: "LLMToolSelectorMiddleware runs before the main model.", table: { title: "Status of ORD-1?", highlight: 1, headers: ["Tool", "Kept for this question"], rows: [["lookup_order", "Yes"], ["issue_refund", "No"], ["store_hours", "No"], ["menu", "No"]] } },
  streaming: { kind: "streaming" },
  thinking: {
    kicker: "10 · Thinking stream",
    caption: "Way 1 labels graph steps. Way 2 is the model's thinking mode: reasoning_content, then the reply.",
    direction: "TD",
    layers: [["START"], ["chatbot"], ["tools", "END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools", label: "tool_calls" },
      { from: "chatbot", to: "END", label: "done" },
    ],
    backEdges: [{ from: "tools", to: "chatbot", label: "result" }],
    meanings: {
      START: "ORD-1 question",
      chatbot: "tools_condition",
      tools: "lookup_order",
      END: "typed answer",
    },
    dashboard: [
      { name: "updates", event: "{node_name: partial update}", when: "Way 1: which node ran — chatbot, then tools" },
      { name: "messages", event: "(token_chunk, meta)", when: "Way 1: last AI reply, typed" },
      { name: "reasoning_format='parsed'", event: "reasoning_content, then content", when: "Way 2: model scratchpad typing, then the same last AI reply" },
    ],
    walk: [
      { nodes: ["START"], edges: [], note: "stream_mode=['updates', 'messages']. One mode alone cannot show a tool spinner and live tokens.", ticket: { stream: "for mode, event in app.stream(..., stream_mode=['updates', 'messages'])" } },
      { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "updates fires first: which node just ran. chatbot may emit tool_calls for ORD-1.", ticket: { print: "[step] chatbot" } },
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "updates: tools ran lookup_order. A support UI can show a spinner here.", ticket: { print: "[step] tools" } },
      { nodes: ["START", "chatbot", "tools", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }, { from: "chatbot", to: "END" }], note: "messages: last AI reply, typed. Way 2 is different: reasoning_format='parsed' types a scratchpad, then that same reply. It does not name the tools node.", ticket: { tokens: "The status of ORD-1 is shipped" } },
    ],
  },
  persistence: {
    kicker: "11 · Persistence",
    caption: "MemorySaver is already the RAM saver. The lesson is the config you pass every invoke, and the order of frames in that thread.",
    direction: "LR",
    layers: [["START"], ["chatbot"], ["END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "END" },
    ],
    side: "MemorySaver",
    sideNote: "RAM. Same compile(checkpointer=...) you already used.",
    meanings: {
      START: "turn arrives",
      chatbot: "a new frame is written",
      END: "thread can resume",
    },
    dashboard: [
      { name: "thread_id", eventLabel: "What it is", event: "which conversation", whenLabel: "On config", when: "configurable.thread_id. Required. Omit checkpoint_id → latest frame." },
      { name: "checkpoint_id", eventLabel: "What it is", event: "which frame of that conversation", whenLabel: "On config", when: "Same dict, optional. Pin one uuid. There is no separate config_id." },
    ],
    configBag: {
      title: "You pass this dict every invoke",
      blurb: "It does not stick by itself. Same thread_id next turn → latest checkpoint. Add checkpoint_id to pin a frame.",
      keys: [
        { path: "configurable.thread_id", value: '"support-1"', note: "required" },
        { path: "configurable.checkpoint_id", value: "<uuid>", note: "optional — omit for latest" },
      ],
    },
    frames: [
      { i: 0, label: "latest", msgs: "most messages", note: "get_state(thread) lands here" },
      { i: 1, label: "older", msgs: "fewer messages", note: "pin checkpoint_id to land here" },
      { i: 2, label: "older", msgs: "even fewer", note: "history[2] — further back" },
    ],
    cases: [
      {
        name: "same thread",
        walk: [
          { nodes: ["START"], edges: [], note: "Part 1. Pass config every invoke: { configurable: { thread_id: 'support-1' } }. Not a config_id — you pass the dict.", ticket: { config: "{ configurable: { thread_id: 'support-1' } }" }, hot: "configurable.thread_id", frame: 0 },
          { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "Turn 1 writes a checkpoint after chatbot. Frame [0] is the only frame.", ticket: { thread_id: "support-1", last: "ORD-1" }, frame: 0 },
          { nodes: ["START", "chatbot", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }], note: "Turn 2: pass the SAME dict again. Latest frame now has more messages. Customer does not repeat ORD-1.", ticket: { print: "same thread: ORD-1" }, frame: 0 },
        ],
      },
      {
        name: "new thread",
        walk: [
          { nodes: ["START"], edges: [], note: "Different thread_id in the config dict. support-2 has its own empty stack in RAM.", ticket: { config: "{ configurable: { thread_id: 'support-2' } }" }, hot: "configurable.thread_id" },
          { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "Same question. Fresh ticket. It does not know ORD-1.", ticket: { thread_id: "support-2", last: "(empty)" } },
          { nodes: ["START", "chatbot", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }], note: "Isolation is the point of thread_id. Two stacks in MemorySaver, not one shared config_id.", ticket: { print: "new thread: (does not know ORD-1)" } },
        ],
      },
      {
        name: "order in RAM",
        walk: [
          { nodes: ["START"], edges: [], note: "Part 2. Each turn appends a frame. get_state_history lists them newest first: [0] latest, then older.", ticket: { print: "get_state_history → N checkpoints in 'support-1'" }, frame: 0 },
          { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "get_state(thread) with only thread_id is [0]. Its config already includes checkpoint_id — you copy it to pin.", ticket: { print: "thread_id: support-1  checkpoint_id: <uuid>" }, hot: "configurable.checkpoint_id", frame: 0 },
          { nodes: ["START", "chatbot", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }], note: "Pass checkpoint_id in the same dict to time-travel to [1] or [2]. Most chats never set it. Next extras on this dict: recursion_limit, metadata.", ticket: { print: "[0] latest  [1] older  [2] older" }, hot: "configurable.checkpoint_id", frame: 1 },
        ],
      },
    ],
  },
  config: {
    kicker: "12 · RunnableConfig",
    caption: "Same config dict you already pass. No config_id. Extra keys ride along this invoke: recursion_limit and metadata.",
    direction: "TD",
    layers: [["START"], ["chatbot"], ["tools", "END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools", label: "tool_calls" },
      { from: "chatbot", to: "END", label: "done" },
    ],
    backEdges: [{ from: "tools", to: "chatbot", label: "result" }],
    meanings: {
      START: "config= this invoke",
      chatbot: "reads metadata",
      tools: "counts as a step",
      END: "or GraphRecursionError",
    },
    dashboard: [
      { name: "recursion_limit", eventLabel: "Where", event: "top-level on the same config dict", whenLabel: "What it does", when: "Max graph steps this invoke. Default ~25. Exceed it → GraphRecursionError. This file sets 10." },
      { name: "metadata", eventLabel: "Where", event: "top-level on the same config dict", whenLabel: "What it does", when: "Free-form for THIS run. A node can read it. The model cannot. Next invoke you pass it again." },
    ],
    configBag: {
      title: "One dict. You pass it every invoke. It does not float onto a thread by itself.",
      blurb: "thread_id / checkpoint_id live under configurable (lesson 10). This file has no checkpointer, so those keys are omitted. recursion_limit and metadata still ride to every node on this run.",
      keys: [
        { path: "configurable.thread_id", value: "(omitted — no checkpointer)", note: "lesson 10", dim: true },
        { path: "configurable.checkpoint_id", value: "(omitted)", note: "lesson 10", dim: true },
        { path: "recursion_limit", value: "10", note: "this lesson" },
        { path: "metadata", value: '{ desk: "vip", order_hint: "ORD-1" }', note: "this lesson" },
      ],
    },
    walk: [
      { nodes: ["START"], edges: [], note: "app.invoke(ticket, config=config). You pass the dict. LangGraph does not invent a config_id, and it does not keep metadata on the thread without a checkpointer.", ticket: { config: "recursion_limit=10, metadata.desk=vip" }, hot: "recursion_limit" },
      { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "chatbot(state, config: RunnableConfig) reads config['metadata'] for this invoke. Prints desk=vip. Writes it onto TicketState.", ticket: { print: "metadata on this run: {desk: 'vip', order_hint: 'ORD-1'} → desk: vip" }, hot: "metadata" },
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "Each hop counts toward recursion_limit. A runaway chatbot↔tools cycle raises GraphRecursionError.", ticket: { desk: "vip", tool: "lookup_order" }, hot: "recursion_limit" },
      { nodes: ["START", "chatbot", "tools", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }, { from: "chatbot", to: "END" }], note: "desk stored from metadata: vip. Next invoke: pass config again. Persistence keys join this same dict when you compile a checkpointer.", ticket: { print: "desk stored from metadata: vip" }, hot: "metadata" },
    ],
  },
  durable: {
    kicker: "13 · Durable checkpointers",
    caption: "Same compile(checkpointer=...) call as MemorySaver. SqliteSaver writes to disk, so a process restart does not wipe the thread.",
    direction: "LR",
    layers: [["START"], ["chatbot"], ["END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "END" },
    ],
    side: "SqliteSaver",
    sideNote: "on disk — survives process restart",
    meanings: {
      START: "process may have restarted",
      chatbot: "reload snapshot from disk",
      END: "ORD-2 still known",
    },
    dashboard: [
      { name: "MemorySaver", eventLabel: "Lives", event: "RAM", whenLabel: "Restart", when: "Thread is gone. Lesson 10." },
      { name: "SqliteSaver", eventLabel: "Lives", event: "disk", whenLabel: "Restart", when: "Thread survives. Same compile(checkpointer=...) call." },
    ],
    walk: [
      { nodes: ["START"], edges: [], note: "thread_id='durable-1'. from_conn_string opens a file on disk. Same graph as lesson 10.", ticket: { thread_id: "durable-1" } },
      { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "Turn 1 stores active order id ORD-2. Only the saver passed to compile changed.", ticket: { thread_id: "durable-1", last: "ORD-2" } },
      { nodes: ["START", "chatbot", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }], note: "Turn 2 after a restart still replies ORD-2. Next: inspect and patch a bad ticket.", ticket: { print: "ORD-2" } },
    ],
  },
  state: {
    kicker: "14 · get_state / update_state",
    caption: "A human reads get_state, writes update_state, then invoke(None) resumes from .next. Persistence cannot do this alone. Not interrupt() yet.",
    direction: "LR",
    layers: [["START"], ["enrich"], ["END"]],
    edges: [
      { from: "START", to: "enrich" },
      { from: "enrich", to: "END" },
    ],
    side: "MemorySaver",
    sideNote: "human sits on the checkpoint — inspect, patch, resume",
    meanings: {
      START: "as_node='__start__'",
      enrich: "look up ORDERS",
      END: "ticket done",
    },
    dashboard: [
      { name: "get_state(config)", eventLabel: "Who", event: "you, then the human", whenLabel: "What", when: "Read latest checkpoint: .values and .next. Print 1 in the file." },
      { name: "update_state(...)", eventLabel: "Who", event: "you, after the human decides", whenLabel: "What", when: "Write the correction. as_node='__start__' sets where resume will run — .next becomes enrich." },
      { name: "invoke(None, config)", eventLabel: "Who", event: "the graph, from .next", whenLabel: "What", when: "Do not send the ticket again. Resume is calculated from the checkpoint." },
    ],
    framesTitle: "Human on the checkpoint · not interrupt() yet",
    frames: [
      { i: 1, label: "get_state", msgs: "read .values", note: "wrong ORD-1 · shipped" },
      { i: 2, label: "human", msgs: "interpret", note: "meant ORD-2" },
      { i: 3, label: "update_state", msgs: "as_node=__start__", note: "next=enrich" },
      { i: 4, label: "invoke(None)", msgs: "resume from .next", note: "ORD-2 → pending" },
    ],
    walk: [
      { nodes: ["START"], edges: [], note: "thread_id='ticket-1'. Agent already ran with the WRONG id ORD-1. Graph is START → enrich → END.", ticket: { order_id: "ORD-1" } },
      { nodes: ["START", "enrich"], edges: [{ from: "START", to: "enrich" }], note: "enrich looked up ORDERS. ORD-1 → shipped. That snapshot is on the checkpointer.", ticket: { order_id: "ORD-1", status: "shipped", note: "Handling ORD-1 → shipped" } },
      { nodes: ["START", "enrich", "END"], edges: [{ from: "START", to: "enrich" }, { from: "enrich", to: "END" }], note: "1) get_state: human sees the wrong id. history checkpoints listed. Persistence will not fix this by itself.", ticket: { print: "1) get_state (wrong id used): ORD-1 shipped" }, frame: 1 },
      { nodes: ["START", "enrich", "END"], edges: [{ from: "START", to: "enrich" }, { from: "enrich", to: "END" }], note: "2) Human interprets: meant ORD-2. No graph node runs. This is the human step — later lessons pause with interrupt(); here you already have the checkpoint.", ticket: { human: "ORD-1 → ORD-2" }, frame: 2 },
      { nodes: ["START"], edges: [], note: "3) update_state(..., {order_id: 'ORD-2'}, as_node='__start__'). .next is calculated from as_node — enrich will run again.", ticket: { order_id: "ORD-2", next: "enrich" }, frame: 3 },
      { nodes: ["START", "enrich", "END"], edges: [{ from: "START", to: "enrich" }, { from: "enrich", to: "END" }], note: "4) invoke(None, config) resumes from .next. Do not pass the ticket again. ORD-2 → pending.", ticket: { print: "3) resume: ORD-2 → pending" }, frame: 4 },
    ],
  },
  subgraph: { kind: "subgraph" },
  when: { kind: "when" },
  pauses: {
    kicker: "02 · Where a pause can sit",
    caption: "Four boundaries on the agent loop. END is still the built-in exit when the model sends no tool call.",
    direction: "TD",
    layers: [["before model"], ["model"], ["after model"], ["before tool"], ["tool"], ["after tool"]],
    edges: [
      { from: "before model", to: "model" },
      { from: "model", to: "after model" },
      { from: "after model", to: "before tool" },
      { from: "before tool", to: "tool" },
      { from: "tool", to: "after tool" },
    ],
    meanings: {
      "before model": "interrupt_before chatbot",
      model: "chatbot writes",
      "after model": "interrupt_after chatbot",
      "before tool": "interrupt_before tools",
      tool: "ToolNode runs",
      "after tool": "interrupt_after tools",
    },
    walk: [
      { nodes: ["before model"], edges: [], note: "The question is in. The model has not written." },
      { nodes: ["before model", "model"], edges: [{ from: "before model", to: "model" }], note: "chatbot runs." },
      { nodes: ["model", "after model"], edges: [{ from: "model", to: "after model" }], note: "You can read the planned tool call. The tool has not run." },
      { nodes: ["after model", "before tool"], edges: [{ from: "after model", to: "before tool" }], note: "The route chose tools. ToolNode has not started." },
      { nodes: ["before tool", "tool"], edges: [{ from: "before tool", to: "tool" }], note: "The tool runs. interrupt() inside request_refund is a stop in the middle of this node." },
      { nodes: ["tool", "after tool"], edges: [{ from: "tool", to: "after tool" }], note: "The tool result is on the ticket. The model has not written the customer reply." },
    ],
  },
  hitl: { kind: "hitl" },
  approve: {
    kicker: "03 · Approve before tools",
    caption: "interrupt_before=['tools'] pauses at the node boundary. Any tool call stops.",
    direction: "LR",
    layers: [["chatbot"], ["pause"], ["tools"], ["reply"]],
    edges: [
      { from: "chatbot", to: "pause", label: "wants cancel_order" },
      { from: "pause", to: "tools", label: "human OK" },
      { from: "tools", to: "reply" },
    ],
    meanings: {
      chatbot: "plans the call",
      pause: "interrupt_before tools",
      tools: "cancel_order runs",
      reply: "agent replies",
    },
    walk: [
      { nodes: ["chatbot"], edges: [], note: "Customer: Cancel ORD-1. The model plans cancel_order(ORD-1)." },
      { nodes: ["chatbot", "pause"], edges: [{ from: "chatbot", to: "pause" }], note: "The graph pauses at the tools node. No special code inside the tool." },
      { nodes: ["chatbot", "pause", "tools"], edges: [{ from: "chatbot", to: "pause" }, { from: "pause", to: "tools" }], note: "Human OK. invoke(None) continues. The tool runs." },
      { nodes: ["chatbot", "pause", "tools", "reply"], edges: [{ from: "chatbot", to: "pause" }, { from: "pause", to: "tools" }, { from: "tools", to: "reply" }], note: "If the order id is wrong, approving is not enough. Next lesson: edit state, then resume." },
    ],
  },
  fix: {
    kicker: "04 · Fix and resume",
    caption: "While paused, update_state patches the id. Then invoke(None) continues.",
    direction: "LR",
    layers: [["chatbot"], ["pause"], ["edit"], ["tools"], ["reply"]],
    edges: [
      { from: "chatbot", to: "pause" },
      { from: "pause", to: "edit", label: "update_state" },
      { from: "edit", to: "tools" },
      { from: "tools", to: "reply" },
    ],
    meanings: {
      chatbot: "planned refund ORD-1",
      pause: "interrupt_before",
      edit: "ORD-1 → ORD-2",
      tools: "runs with ORD-2",
      reply: "agent replies",
    },
    walk: [
      { nodes: ["chatbot"], edges: [], note: "Customer said refund ORD-1 but meant ORD-2.", ticket: { pending: "ORD-1" } },
      { nodes: ["chatbot", "pause"], edges: [{ from: "chatbot", to: "pause" }], note: "Desk sees the pending tool call. Approve/reject cannot correct the id." },
      { nodes: ["chatbot", "pause", "edit"], edges: [{ from: "chatbot", to: "pause" }, { from: "pause", to: "edit" }], note: "update_state writes ORD-2 on the checkpoint.", ticket: { pending: "ORD-2" } },
      { nodes: ["chatbot", "pause", "edit", "tools", "reply"], edges: [{ from: "chatbot", to: "pause" }, { from: "pause", to: "edit" }, { from: "edit", to: "tools" }, { from: "tools", to: "reply" }], note: "invoke(None, config) continues. You are not starting a new question." },
    ],
  },
  handoff: {
    kicker: "05 · Agent handoff",
    caption: "classify routes to a whole specialist graph, not a single desk function.",
    direction: "TD",
    layers: [["START"], ["classify"], ["refund_agent", "tracking_agent", "general_agent"], ["END"]],
    edges: [
      { from: "START", to: "classify" },
      { from: "classify", to: "refund_agent", label: "refund" },
      { from: "classify", to: "tracking_agent", label: "tracking" },
      { from: "classify", to: "general_agent", label: "other" },
      { from: "refund_agent", to: "END" },
      { from: "tracking_agent", to: "END" },
      { from: "general_agent", to: "END" },
    ],
    meanings: {
      START: "ticket in",
      classify: "coordinator",
      refund_agent: "specialist subgraph",
      tracking_agent: "specialist subgraph",
      general_agent: "specialist subgraph",
      END: "specialist answered",
    },
    cases: [
      {
        name: "refund",
        walk: [
          { nodes: ["START"], edges: [], note: "A refund question. The coordinator does not answer it itself." },
          { nodes: ["START", "classify"], edges: [{ from: "START", to: "classify" }], note: "classify picks refund. Unlike routing nodes, the next step is a whole agent." },
          { nodes: ["START", "classify", "refund_agent"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "refund_agent" }], note: "refund_agent has its own tools and prompt. The other specialists stay on the graph." },
          { nodes: ["START", "classify", "refund_agent", "END"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "refund_agent" }, { from: "refund_agent", to: "END" }], note: "Use this when intents need different behavior, not only a different node name." },
        ],
      },
      {
        name: "tracking",
        walk: [
          { nodes: ["START", "classify"], edges: [{ from: "START", to: "classify" }], note: "Tracking question." },
          { nodes: ["START", "classify", "tracking_agent", "END"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "tracking_agent" }, { from: "tracking_agent", to: "END" }], note: "tracking_agent runs. refund_agent does not." },
        ],
      },
      {
        name: "other",
        walk: [
          { nodes: ["START", "classify"], edges: [{ from: "START", to: "classify" }], note: "Neither refund nor tracking." },
          { nodes: ["START", "classify", "general_agent", "END"], edges: [{ from: "START", to: "classify" }, { from: "classify", to: "general_agent" }, { from: "general_agent", to: "END" }], note: "general_agent handles it." },
        ],
      },
    ],
  },
  debug: {
    kicker: "01 · Debugging agents",
    caption: "Four failures. Four places to look. The graph is a glass box.",
    direction: "TD",
    layers: [["START"], ["chatbot"], ["tools", "END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools", label: "tool_calls" },
      { from: "chatbot", to: "END", label: "done" },
    ],
    backEdges: [{ from: "tools", to: "chatbot", label: "result" }],
    meanings: {
      START: "question",
      chatbot: "print tool_calls",
      tools: "stream updates",
      END: "or get_state",
    },
    cases: [
      {
        name: "wrong tool",
        walk: [
          { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "Print msg.tool_calls. The model planned the wrong name, or no tool at all." },
        ],
      },
      {
        name: "infinite loop",
        walk: [
          { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "stream(mode='updates') shows the same nodes repeating. recursion_limit turns that into a stop." },
        ],
      },
      {
        name: "ignored result",
        walk: [
          { nodes: ["START", "chatbot", "tools", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }, { from: "chatbot", to: "END" }], note: "The list has a ToolMessage (shipped) and then an AIMessage that guesses anyway. That is ignored tool result, not a missing tool." },
        ],
      },
      {
        name: "bad args",
        walk: [
          { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "tool_calls args are the wrong shape. get_state while paused shows the pending call." },
        ],
      },
    ],
  },
};

function isOn(list, name) {
  if (!list) return true;
  return list.includes(name);
}

function edgeOn(list, from, to) {
  if (!list) return true;
  return list.some((e) => e.from === from && e.to === to);
}

function NodeBox({ name, on, meaning }) {
  const terminal = name === "START" || name === "END";
  return (
    <div
      className={`min-w-[6.5rem] max-w-[9.5rem] px-3 py-2 text-center transition-all ${
        terminal ? "rounded-full" : "rounded-lg"
      } ${
        on
          ? terminal
            ? "border border-emerald-400 bg-emerald-950 text-emerald-200 ring-2 ring-emerald-400/30"
            : "border border-teal-400 bg-teal-500/15 text-teal-100 ring-2 ring-teal-400/30"
          : "border border-slate-700 bg-slate-950/70 text-slate-500"
      }`}
    >
      <p className="m-0 font-mono text-xs font-semibold">{name}</p>
      {meaning ? <p className="m-0 mt-0.5 font-serif text-[10px] font-normal leading-snug opacity-80">{meaning}</p> : null}
    </div>
  );
}

function Label({ text, on }) {
  if (!text) return null;
  return (
    <span
      className={`rounded px-1.5 py-0.5 font-mono text-[10px] leading-none ${
        on ? "bg-teal-400/20 text-teal-200" : "bg-slate-800 text-slate-500"
      }`}
    >
      {text}
    </span>
  );
}

function Stem({ on, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`h-6 w-px ${on ? "bg-teal-400" : "bg-slate-600"}`} />
      <Label text={label} on={on} />
    </div>
  );
}

function TBar({ count }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex h-px min-w-0 flex-1">
          <div className={`h-px flex-1 ${i === 0 ? "bg-transparent" : "bg-slate-500"}`} />
          <div className={`h-px flex-1 ${i === count - 1 ? "bg-transparent" : "bg-slate-500"}`} />
        </div>
      ))}
    </div>
  );
}

function LayerConnect({ above, below, edges, activeEdges, direction }) {
  const links = edges.filter((e) => above.includes(e.from) && below.includes(e.to));
  if (!links.length) return <div className={direction === "LR" ? "w-6" : "h-6"} />;

  if (above.length === 1 && below.length === 1) {
    const on = edgeOn(activeEdges, above[0], below[0]);
    const label = links[0]?.label;
    if (direction === "LR") {
      return (
        <div className="flex items-center gap-1 px-1">
          <div className={`h-px w-8 ${on ? "bg-teal-400" : "bg-slate-500"}`} />
          <Label text={label} on={on} />
          {label ? <div className={`h-px w-3 ${on ? "bg-teal-400" : "bg-slate-500"}`} /> : null}
        </div>
      );
    }
    return <Stem on={on} label={label} />;
  }

  if (direction === "LR") {
    return (
      <div className="flex items-center px-1">
        <div className="h-px w-8 bg-slate-500" />
      </div>
    );
  }

  const widthClass = below.length >= 3 || above.length >= 3 ? "w-full max-w-xl" : "w-full max-w-md";

  if (above.length === 1 && below.length > 1) {
    return (
      <div className={`flex flex-col items-center ${widthClass}`}>
        <div className="h-5 w-px bg-slate-500" />
        <TBar count={below.length} />
        <div className="flex w-full">
          {below.map((to) => {
            const link = links.find((l) => l.to === to);
            const on = edgeOn(activeEdges, above[0], to);
            return (
              <div key={to} className="flex flex-1 flex-col items-center">
                <div className={`h-5 w-px ${on ? "bg-teal-400" : "bg-slate-500"}`} />
                <Label text={link?.label} on={on} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (above.length > 1 && below.length === 1) {
    return (
      <div className={`flex flex-col items-center ${widthClass}`}>
        <div className="flex w-full">
          {above.map((from) => {
            const on = edgeOn(activeEdges, from, below[0]);
            return (
              <div key={from} className="flex flex-1 flex-col items-center">
                <div className={`h-5 w-px ${on ? "bg-teal-400" : "bg-slate-500"}`} />
              </div>
            );
          })}
        </div>
        <TBar count={above.length} />
        <div className="h-5 w-px bg-slate-500" />
      </div>
    );
  }

  return <div className="h-6" />;
}

function FlowChart({ spec, activeNodes, activeEdges }) {
  const lr = spec.direction === "LR";
  return (
    <div className={`relative ${lr ? "flex flex-row items-center justify-center overflow-x-auto py-1" : "flex flex-col items-center py-1"}`}>
      {spec.layers.map((layer, i) => (
        <div key={i} className={lr ? "flex flex-row items-center" : "flex w-full flex-col items-center"}>
          {i > 0 ? (
            <LayerConnect
              above={spec.layers[i - 1]}
              below={layer}
              edges={spec.edges}
              activeEdges={activeEdges}
              direction={spec.direction}
            />
          ) : null}
          <div
            className={`flex items-center justify-center ${
              lr ? "gap-0" : layer.length > 1 ? "w-full max-w-xl gap-3" : ""
            }`}
          >
            {layer.map((name) => (
              <div key={name} className={lr ? "" : "flex flex-1 justify-center"}>
                <NodeBox name={name} on={isOn(activeNodes, name)} meaning={spec.meanings?.[name]} />
              </div>
            ))}
          </div>
        </div>
      ))}
      {spec.backEdges?.length ? (
        <p className="mt-3 font-mono text-[11px] text-slate-400">
          {spec.backEdges.map((e) => (
            <span key={`${e.from}-${e.to}`}>
              ↺ {e.from} ← {e.to}
              {e.label ? ` · ${e.label}` : ""}
            </span>
          ))}
        </p>
      ) : null}
      {spec.side ? (
        <p className="mt-3 rounded-lg border border-dashed border-teal-700/70 px-3 py-2 text-center font-serif text-xs text-teal-200">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">{spec.side}</span>
          <span className="mt-0.5 block text-slate-400">
            {spec.sideNote || "sits beside the graph and stores snapshots"}
          </span>
        </p>
      ) : null}
      <MermaidDiagram spec={spec} />
    </div>
  );
}

function WalkBar({ walk, step, setStep, playing, setPlaying, idleNote }) {
  if (!walk?.length) return null;
  const beat = step >= 0 ? walk[step] : null;
  return (
    <div className="mt-4 border-t border-slate-800 pt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
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
            setStep(-1);
          }}
          className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          Whole graph
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.max(0, s < 0 ? 0 : s - 1));
          }}
          className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          Step back
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(walk.length - 1, s < 0 ? 0 : s + 1));
          }}
          className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          Step
        </button>
        <span className="font-mono text-[11px] text-slate-500">{step < 0 ? "all nodes" : `${step + 1} / ${walk.length}`}</span>
      </div>
      <p className="m-0 rounded-xl border border-teal-900/40 bg-teal-950/30 px-3.5 py-2.5 font-serif text-sm text-teal-100">
        {beat ? beat.note : idleNote || "The full graph is on the page. Press Play to watch the ticket move through it."}
      </p>
      {beat?.ticket ? (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[11px] text-slate-300">
          {Object.entries(beat.ticket).map(([k, v]) => (
            <p key={k} className="m-0 leading-relaxed">
              <span className="text-teal-300">{k}</span>
              <span className="text-slate-500">: </span>
              {String(v)}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function useWalk(walk, resetKey) {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [seenKey, setSeenKey] = useState(resetKey);

  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setStep(-1);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || !walk?.length) return undefined;
    const timer = setInterval(() => {
      setStep((s) => {
        const next = s < 0 ? 0 : s + 1;
        if (next >= walk.length) {
          setPlaying(false);
          return walk.length - 1;
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [playing, walk]);

  const beat = step >= 0 ? walk[step] : null;
  return { step, setStep, playing, setPlaying, beat };
}

const REDUCER_PATH = ["START", "normalize", "enrich", "END"];

const REDUCER_CASES = [
  {
    name: "with reducers",
    walk: [
      {
        node: "START",
        note: "invoke() starts with this ticket. No node has written yet. new = reducer(old, update) has not run.",
        rows: [
          { field: "order_id", ann: "plain str", op: "overwrite", old: '" ord-1 "', update: "—", neu: '" ord-1 "' },
          { field: "status", ann: "plain str", op: "overwrite", old: '""', update: "—", neu: '""' },
          { field: "note", ann: "plain str", op: "overwrite", old: '""', update: "—", neu: '""' },
          { field: "touch_count", ann: "Annotated[int, add]", op: "add · sum", old: "0", update: "—", neu: "0" },
          { field: "events", ann: "Annotated[list, add]", op: "add · concat", old: "[]", update: "—", neu: "[]" },
          { field: "messages", ann: "Annotated[list, add_messages]", op: "append", old: "[]", update: "—", neu: "[]" },
        ],
      },
      {
        node: "normalize",
        note: "normalize returns a partial dict — only the fields it changes. Each field merges on its own rule.",
        hot: ["order_id", "touch_count", "events", "messages"],
        rows: [
          { field: "order_id", ann: "plain str", op: "overwrite", old: '" ord-1 "', update: '"ORD-1"', neu: '"ORD-1"', hint: "new = update" },
          { field: "status", ann: "plain str", op: "overwrite", old: '""', update: "—", neu: '""' },
          { field: "note", ann: "plain str", op: "overwrite", old: '""', update: "—", neu: '""' },
          { field: "touch_count", ann: "Annotated[int, add]", op: "add · sum", old: "0", update: "1", neu: "1", hint: "add(0, 1)" },
          { field: "events", ann: "Annotated[list, add]", op: "add · concat", old: "[]", update: '["normalized"]', neu: '["normalized"]', hint: "[] + [\"normalized\"]" },
          { field: "messages", ann: "Annotated[list, add_messages]", op: "append", old: "[]", update: "HumanMessage", neu: "[Need help with ORD-1]", hint: "append, not list +" },
        ],
      },
      {
        node: "enrich",
        note: "enrich also returns touch_count: 1 and events: ['enriched']. add keeps both writes. status / note overwrite because they are plain fields.",
        hot: ["status", "note", "touch_count", "events", "messages"],
        rows: [
          { field: "order_id", ann: "plain str", op: "overwrite", old: '"ORD-1"', update: "—", neu: '"ORD-1"' },
          { field: "status", ann: "plain str", op: "overwrite", old: '""', update: '"shipped"', neu: '"shipped"', hint: "new = update" },
          { field: "note", ann: "plain str", op: "overwrite", old: '""', update: '"ORD-1 is currently shipped"', neu: '"ORD-1 is currently shipped"', hint: "new = update" },
          { field: "touch_count", ann: "Annotated[int, add]", op: "add · sum", old: "1", update: "1", neu: "2", hint: "add(1, 1) → 2" },
          { field: "events", ann: "Annotated[list, add]", op: "add · concat", old: '["normalized"]', update: '["enriched"]', neu: '["normalized", "enriched"]', hint: "concat keeps the audit trail" },
          { field: "messages", ann: "Annotated[list, add_messages]", op: "append", old: "[HumanMessage]", update: "AIMessage", neu: "[Need help… | ORD-1 is currently shipped]", hint: "append, not list +" },
        ],
      },
      {
        node: "END",
        note: "Matches the print() in the file: overwrite ORD-1 / shipped, sum 2, events both steps, two messages. Path is still scripted.",
        rows: [
          { field: "order_id", ann: "plain str", op: "overwrite", old: '"ORD-1"', update: "—", neu: '"ORD-1"' },
          { field: "status", ann: "plain str", op: "overwrite", old: '"shipped"', update: "—", neu: '"shipped"' },
          { field: "note", ann: "plain str", op: "overwrite", old: '"ORD-1 is currently shipped"', update: "—", neu: '"ORD-1 is currently shipped"' },
          { field: "touch_count", ann: "Annotated[int, add]", op: "add · sum", old: "2", update: "—", neu: "2" },
          { field: "events", ann: "Annotated[list, add]", op: "add · concat", old: '["normalized", "enriched"]', update: "—", neu: '["normalized", "enriched"]' },
          { field: "messages", ann: "Annotated[list, add_messages]", op: "append", old: "[Human | AI]", update: "—", neu: "[Need help… | ORD-1 is currently shipped]" },
        ],
      },
    ],
  },
  {
    name: "plain overwrite",
    walk: [
      {
        node: "START",
        note: "Same ticket, but every field is a plain type. LangGraph will do new = update. Nothing accumulates.",
        rows: [
          { field: "order_id", ann: "plain str", op: "overwrite", old: '" ord-1 "', update: "—", neu: '" ord-1 "' },
          { field: "touch_count", ann: "plain int", op: "overwrite", old: "0", update: "—", neu: "0" },
          { field: "events", ann: "plain list", op: "overwrite", old: "[]", update: "—", neu: "[]" },
          { field: "messages", ann: "plain list", op: "overwrite", old: "[]", update: "—", neu: "[]" },
        ],
      },
      {
        node: "normalize",
        note: "normalize writes events=['normalized'] and touch_count=1. Fine so far — there is nothing to keep yet.",
        hot: ["order_id", "touch_count", "events", "messages"],
        rows: [
          { field: "order_id", ann: "plain str", op: "overwrite", old: '" ord-1 "', update: '"ORD-1"', neu: '"ORD-1"', hint: "new = update" },
          { field: "touch_count", ann: "plain int", op: "overwrite", old: "0", update: "1", neu: "1", hint: "new = update" },
          { field: "events", ann: "plain list", op: "overwrite", old: "[]", update: '["normalized"]', neu: '["normalized"]', hint: "new = update" },
          { field: "messages", ann: "plain list", op: "overwrite", old: "[]", update: "[HumanMessage]", neu: "[HumanMessage]", hint: "new = update" },
        ],
      },
      {
        node: "enrich",
        note: "enrich writes events=['enriched'] and touch_count=1. Last write wins. normalized is gone. Count is 1, not 2.",
        hot: ["touch_count", "events", "messages"],
        rows: [
          { field: "order_id", ann: "plain str", op: "overwrite", old: '"ORD-1"', update: "—", neu: '"ORD-1"' },
          { field: "touch_count", ann: "plain int", op: "overwrite", old: "1", update: "1", neu: "1", hint: "1 replaced 1 — never summed" },
          { field: "events", ann: "plain list", op: "overwrite", old: '["normalized"]', update: '["enriched"]', neu: '["enriched"]', hint: "audit trail wiped" },
          { field: "messages", ann: "plain list", op: "overwrite", old: "[HumanMessage]", update: "[AIMessage]", neu: "[AIMessage]", hint: "HumanMessage gone" },
        ],
      },
      {
        node: "END",
        note: "This is why the file uses Annotated. Without a reducer, later nodes erase earlier writes.",
        rows: [
          { field: "order_id", ann: "plain str", op: "overwrite", old: '"ORD-1"', update: "—", neu: '"ORD-1"' },
          { field: "touch_count", ann: "plain int", op: "overwrite", old: "1", update: "—", neu: "1" },
          { field: "events", ann: "plain list", op: "overwrite", old: '["enriched"]', update: "—", neu: '["enriched"]' },
          { field: "messages", ann: "plain list", op: "overwrite", old: "[AIMessage]", update: "—", neu: "[AIMessage]" },
        ],
      },
    ],
  },
];

function MergeRow({ row, hot }) {
  const on = hot?.includes(row.field);
  const merging = row.update !== "—";
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        on ? "border-teal-400 bg-teal-500/10 ring-1 ring-teal-400/30" : "border-slate-800 bg-slate-950/60"
      }`}
    >
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-xs font-semibold text-slate-100">{row.field}</span>
        <span className="font-mono text-[10px] text-slate-500">{row.ann}</span>
      </div>
      {merging ? (
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] leading-relaxed text-slate-300">
          <span className="text-slate-400">{row.old}</span>
          <span className="text-teal-300">{row.op === "overwrite" ? "←" : row.op === "append" ? "⊕" : "+"}</span>
          <span className="text-amber-200">{row.update}</span>
          <span className="text-slate-600">→</span>
          <span className="font-semibold text-teal-200">{row.neu}</span>
        </p>
      ) : (
        <p className="m-0 font-mono text-[11px] text-slate-400">
          now: <span className="text-slate-200">{row.neu}</span>
        </p>
      )}
      {row.hint ? <p className="m-0 mt-1 font-serif text-[11px] text-slate-500">{row.hint}</p> : null}
    </div>
  );
}

function StateReducers({ caseIdx, setCaseIdx }) {
  const active = REDUCER_CASES[caseIdx];
  const { step, setStep, playing, setPlaying, beat } = useWalk(active.walk, `reducers-${caseIdx}`);
  const node = beat?.node;
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">05 · State and reducers</p>
      <p className="mt-1 mb-3 font-serif text-lg text-slate-200">
        Nodes return partial updates. A reducer merges each field: new = reducer(old, update). Without Annotated, new = update.
      </p>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">Overwrite</p>
          <p className="m-0 mt-1 font-mono text-[11px] text-slate-200">order_id, status, note</p>
          <p className="m-0 mt-0.5 font-serif text-[11px] text-slate-500">plain type · last write wins</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">add</p>
          <p className="m-0 mt-1 font-mono text-[11px] text-slate-200">touch_count · events</p>
          <p className="m-0 mt-0.5 font-serif text-[11px] text-slate-500">sum ints · concatenate lists</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">add_messages</p>
          <p className="m-0 mt-1 font-mono text-[11px] text-slate-200">messages</p>
          <p className="m-0 mt-0.5 font-serif text-[11px] text-slate-500">append chat messages</p>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {REDUCER_CASES.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={() => setCaseIdx(i)}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 font-sans text-xs font-semibold transition-all ${
              i === caseIdx
                ? "border-teal-400 bg-teal-400 text-slate-950"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
          {REDUCER_PATH.map((name, i) => (
            <div key={name} className="flex items-center gap-1.5">
              <NodeBox
                name={name}
                on={node === name}
                meaning={name === "START" ? "invoke" : name === "END" ? "print()" : "partial dict"}
              />
              {i < REDUCER_PATH.length - 1 ? (
                <div className={`h-px w-5 sm:w-8 ${node && REDUCER_PATH.indexOf(node) > i ? "bg-teal-400" : "bg-slate-600"}`} />
              ) : null}
            </div>
          ))}
        </div>
        <p className="mb-3 text-center font-mono text-[11px] text-slate-500">
          same path as lesson 02 · the picture is the merge, not the line
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(beat?.rows || active.walk[0].rows).map((row) => (
            <MergeRow key={row.field} row={row} hot={beat?.hot} />
          ))}
        </div>
        <WalkBar
          walk={active.walk}
          step={step}
          setStep={setStep}
          playing={playing}
          setPlaying={setPlaying}
          idleNote="Press Play. Each step is one node's partial dict merging into the ticket."
        />
      </div>
    </div>
  );
}

const WHY_ELEMENTARY = {
  direction: "LR",
  layers: [["START"], ["P"], ["END"]],
  edges: [
    { from: "START", to: "P" },
    { from: "P", to: "END" },
  ],
  meanings: {
    START: "always begin here",
    P: "prompt the LLM",
    END: "always finish here",
  },
};

const WHY_GRAPH = {
  direction: "TD",
  layers: [["START"], ["normalize"], ["escalate", "normal"], ["END"]],
  edges: [
    { from: "START", to: "normalize" },
    { from: "normalize", to: "escalate", label: "cancelled" },
    { from: "normalize", to: "normal", label: "else" },
    { from: "escalate", to: "END" },
    { from: "normal", to: "END" },
  ],
  meanings: {
    START: "ticket in",
    normalize: "lookup ORDERS",
    escalate: "specialist desk",
    normal: "normal reply",
    END: "always finish here",
  },
};

const WHY_APPROACHES = [
  {
    name: "LLM",
    n: "1",
    verdict: "fails",
    line: "one invoke",
    why: "System prompt mentions escalation. The model might not. You have no path to force.",
    walk: [
      { note: "Status of ORD-3? One invoke. Known orders live only in the prompt." },
      { note: "Problem: the model might escalate cancelled. It might not. There is no escalate node." },
    ],
  },
  {
    name: "Chain",
    n: "2",
    verdict: "fails",
    line: "prompt | model | parser",
    why: "You look up ORD-3 yourself. The chain is A → B → C. It cannot pick a desk.",
    walk: [
      { note: "You look up ORD-3 first. A chain cannot decide that — lookup sits outside." },
      { note: "Problem: prompt | model | parser always runs the same line. No escalate vs normal." },
    ],
  },
  {
    name: "LangGraph",
    n: "3",
    verdict: "solves",
    line: "normalize → route",
    why: "route() reads status. Cancelled goes to escalate. Else goes to normal.",
  },
];

const WHY_TICKETS = [
  {
    name: "ORD-3 cancelled",
    walk: [
      { nodes: ["START"], edges: [], note: "Same question: Status of ORD-3? TicketState is empty except order_id." },
      { nodes: ["START", "normalize"], edges: [{ from: "START", to: "normalize" }], note: "normalize strips/uppers the id and looks up ORDERS. status = cancelled." },
      { nodes: ["START", "normalize", "escalate"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "escalate" }], note: "route() returns escalate. normal stays on the graph; it does not run." },
      { nodes: ["START", "normalize", "escalate", "END"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "escalate" }, { from: "escalate", to: "END" }], note: "Print: Order ORD-3 is cancelled — escalating to specialist team." },
    ],
  },
  {
    name: "ORD-1 shipped",
    walk: [
      { nodes: ["START"], edges: [], note: "Same graph, other ticket: ORD-1. The file runs both." },
      { nodes: ["START", "normalize"], edges: [{ from: "START", to: "normalize" }], note: "normalize looks up ORDERS. status = shipped." },
      { nodes: ["START", "normalize", "normal"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "normal" }], note: "route() returns normal. escalate does not run." },
      { nodes: ["START", "normalize", "normal", "END"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "normal" }, { from: "normal", to: "END" }], note: "Print: Order ORD-1 status: shipped. Cancelled → escalate, shipped → normal." },
    ],
  },
];

function WhyLangGraph() {
  const [approach, setApproach] = useState(2);
  const [ticket, setTicket] = useState(0);
  const place = WHY_APPROACHES[approach];
  const walk = approach < 2 ? place.walk : WHY_TICKETS[ticket].walk;
  const { step, setStep, playing, setPlaying, beat } = useWalk(walk, `why-${approach}-${ticket}`);
  const solves = place.verdict === "solves";

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">01 · Why LangGraph</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">
        Every process is a graph. START, then whatever you put in the middle, then END.
      </p>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        <p className="m-0 mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">Elementary · what we build first</p>
        <FlowChart spec={WHY_ELEMENTARY} />
      </div>
      <p className="mt-4 mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Same ORD-3 · three approaches</p>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {WHY_APPROACHES.map((item, i) => {
          const on = i === approach;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setApproach(i)}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                on ? "border-teal-400 bg-teal-950/40 ring-1 ring-teal-400/30" : "border-slate-700 bg-slate-900/80 hover:bg-slate-800"
              }`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className={`m-0 font-mono text-xs font-bold ${on ? "text-teal-200" : "text-slate-300"}`}>
                  {item.n} · {item.name}
                </p>
                <p className={`m-0 font-mono text-[10px] uppercase tracking-wider ${item.verdict === "solves" ? "text-amber-200" : "text-slate-500"}`}>
                  {item.verdict}
                </p>
              </div>
              <p className="m-0 font-mono text-[11px] text-slate-300">{item.line}</p>
              <p className="m-0 mt-2 font-serif text-[12px] text-slate-500">{item.why}</p>
            </button>
          );
        })}
      </div>
      {solves ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {WHY_TICKETS.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setTicket(i)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 font-sans text-xs font-semibold transition-all ${
                i === ticket
                  ? "border-teal-400 bg-teal-400 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        {solves ? (
          <FlowChart spec={WHY_GRAPH} activeNodes={beat?.nodes} activeEdges={beat?.edges} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <MiniChain steps={approach === 0 ? ["prompt", "hope"] : ["lookup (you)", "prompt", "model", "parser"]} />
            <p className="m-0 font-serif text-sm text-slate-400">{place.why}</p>
          </div>
        )}
        <WalkBar
          walk={walk}
          step={step}
          setStep={setStep}
          playing={playing}
          setPlaying={setPlaying}
          idleNote={
            solves
              ? "How LangGraph handles it: route() reads status. Press Play. Switch ORD-1 for the other desk."
              : `${place.name} cannot branch. Press Play, then open LangGraph.`
          }
        />
      </div>
    </div>
  );
}

const STREAM_GRAPH = {
  direction: "LR",
  layers: [["START"], ["chatbot"], ["END"]],
  edges: [
    { from: "START", to: "chatbot" },
    { from: "chatbot", to: "END" },
  ],
  meanings: {
    START: "the question",
    chatbot: "writes one sentence",
    END: "finished ticket",
  },
};

const STREAM_QUESTION = "Write one sentence: order ORD-1 has shipped.";

const STREAM_MODES = [
  {
    name: "updates",
    event: "{node_name: partial update}",
    when: "Debug / progress: which node just wrote what",
    see: "print the dict. {'chatbot': ['AIMessage: …']} — HumanMessage is not here.",
    walk: [
      {
        nodes: ["START"],
        edges: [],
        note: "Same question as the other three watches. No tools. stream_mode='updates'.",
        ticket: { question: STREAM_QUESTION },
      },
      {
        nodes: ["START", "chatbot"],
        edges: [{ from: "START", to: "chatbot" }],
        note: "print() shows only what chatbot returned. The HumanMessage is not in this dict.",
        ticket: { print: "{'chatbot': ['AIMessage: Order ORD-1 has shipped.']}" },
      },
      {
        nodes: ["START", "chatbot", "END"],
        edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }],
        note: "Use this to debug: which node just wrote what. Next lesson, tools sends an updates event too.",
        ticket: { print: "{'chatbot': ['AIMessage: Order ORD-1 has shipped.']}" },
      },
    ],
  },
  {
    name: "values",
    event: "full TicketState after that step",
    when: "UI that re-renders the whole ticket each step",
    see: "Human: Write one sentence: order ORD-1 has shipped. Then that plus AI: Order ORD-1 has shipped.",
    walk: [
      {
        nodes: ["START"],
        edges: [],
        note: "Same question. stream_mode='values'. Each event is the full ticket — not a delta.",
        ticket: { print: "HumanMessage: Write one sentence: order ORD-1 has shipped." },
      },
      {
        nodes: ["START", "chatbot"],
        edges: [{ from: "START", to: "chatbot" }],
        note: "The question is still on the ticket. The reply is added: AIMessage: Order ORD-1 has shipped.",
        ticket: { print: "HumanMessage: Write one sentence… | AIMessage: Order ORD-1 has shipped." },
      },
      {
        nodes: ["START", "chatbot", "END"],
        edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }],
        note: "Same two lines. A chat screen redraws from this full ticket.",
        ticket: { print: "HumanMessage: Write one sentence… | AIMessage: Order ORD-1 has shipped." },
      },
    ],
  },
  {
    name: "messages",
    event: "(token_chunk, meta) from the LLM",
    when: "Last AI reply, typing effect",
    see: "Only the last AI response. Tokens type it out.",
    walk: [
      {
        nodes: ["START"],
        edges: [],
        note: "messages is not a dump of the last message. Each event is a piece of that sentence while chatbot is still writing. The HumanMessage never shows up.",
        ticket: { what: "last AI reply only" },
      },
      {
        nodes: ["START", "chatbot"],
        edges: [{ from: "START", to: "chatbot" }],
        note: "First piece. Then more pieces. Join them and you get the sentence invoke() prints at the end.",
        ticket: { print: "Order" },
      },
      {
        nodes: ["START", "chatbot", "END"],
        edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }],
        note: "Done typing. Still only that last AI response.",
        ticket: { print: "Order ORD-1 has shipped." },
      },
    ],
  },
  {
    name: "invoke()",
    event: "one final state (not streaming)",
    when: "Same last AI reply, dumped once",
    see: "Only the last AI response. No typing.",
    walk: [
      {
        nodes: ["START"],
        edges: [],
        note: "invoke() also gives only the last AI response. It does not type.",
        ticket: { what: "last AI reply, wait" },
      },
      {
        nodes: ["START", "chatbot"],
        edges: [{ from: "START", to: "chatbot" }],
        note: "Still waiting. messages is already typing the same reply.",
        ticket: { print: "(waiting)" },
      },
      {
        nodes: ["START", "chatbot", "END"],
        edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }],
        note: "Same last AI response as messages, dumped once.",
        ticket: { print: "Order ORD-1 has shipped." },
      },
    ],
  },
];

function StreamModes({ caseIdx, setCaseIdx }) {
  const active = STREAM_MODES[caseIdx];
  const { step, setStep, playing, setPlaying, beat } = useWalk(active.walk, `streaming-${caseIdx}`);
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">09 · Streaming</p>
      <p className="mt-1 mb-3 font-serif text-lg text-slate-200">
        Same question, four watches. No tools. Only stream_mode (or invoke) changes.
      </p>
      <p className="mb-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[11px] text-slate-300">
        <span className="text-teal-300">question</span>
        <span className="text-slate-500">: </span>
        {STREAM_QUESTION}
      </p>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {STREAM_MODES.map((mode, i) => (
          <button
            key={mode.name}
            type="button"
            onClick={() => setCaseIdx(i)}
            className={`cursor-pointer rounded-xl border px-3 py-3 text-left transition-colors ${
              i === caseIdx
                ? "border-teal-400 bg-teal-950/60"
                : "border-slate-700 bg-slate-900 hover:bg-slate-800"
            }`}
          >
            <p className={`m-0 font-mono text-xs font-bold ${i === caseIdx ? "text-teal-300" : "text-slate-200"}`}>
              {mode.name}
            </p>
            <p className="m-0 mt-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Each event is</p>
            <p className="m-0 mt-0.5 font-mono text-[11px] text-slate-200">{mode.event}</p>
            <p className="m-0 mt-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">When to use</p>
            <p className="m-0 mt-0.5 font-serif text-[12px] text-slate-400">{mode.when}</p>
            <p className="m-0 mt-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">How to see</p>
            <p className="m-0 mt-0.5 font-serif text-[12px] text-slate-400">{mode.see}</p>
          </button>
        ))}
      </div>
      <CompareTable
        table={{
          title: "messages vs invoke() — both are only the last AI response",
          highlight: 2,
          headers: ["Watch", "What you get", "How it arrives"],
          rows: [
            ["messages", "last AI response only", "token by token — typing effect"],
            ["invoke()", "last AI response only", "one dump, no typing"],
          ],
        }}
      />
      <p className="mb-3 font-serif text-sm text-slate-300">
        Four prints of one question. Typing is messages, not updates. updates is the finished AI line from chatbot. values is the question and that AI line together.
      </p>
      <div className="mb-4 grid gap-2">
        {[
          ["updates", "{'chatbot': ['AIMessage: Order ORD-1 has shipped.']}", "The question is not here. This arrives once, when chatbot finishes."],
          ["values", "Human: Write one sentence: order ORD-1 has shipped.", "Then also AI: Order ORD-1 has shipped. Whole chat, for a screen redraw."],
          ["messages", "\"Order\"   \" ORD-1\"   \" has shipped.\"", "This is the typing effect. Pieces of the AI sentence only."],
          ["invoke()", "Order ORD-1 has shipped.", "Same sentence as messages, one print, after the wait."],
        ].map(([name, line, note]) => (
          <div key={name} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
            <p className="m-0 font-mono text-[11px] font-bold text-teal-300">{name}</p>
            <p className="m-0 mt-1 font-mono text-[12px] text-slate-200">{line}</p>
            <p className="m-0 mt-0.5 font-serif text-[12px] text-slate-400">{note}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        <FlowChart spec={STREAM_GRAPH} activeNodes={beat?.nodes} activeEdges={beat?.edges} />
        <WalkBar
          walk={active.walk}
          step={step}
          setStep={setStep}
          playing={playing}
          setPlaying={setPlaying}
          idleNote="START → chatbot → END. Pick a mode, then Play to see what that print looks like."
        />
      </div>
    </div>
  );
}

function CompareTable({ table }) {
  if (!table?.headers?.length || !table?.rows?.length) return null;
  const hot = table.highlight ?? 2;
  return (
    <div className="mb-4 overflow-x-auto">
      <p className="m-0 mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">{table.title || "When to use which"}</p>
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-700">
            {table.headers.map((header, i) => (
              <th
                key={header}
                className={`py-2 pr-3 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  i === hot ? "text-teal-300" : "text-slate-500"
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row[0]} className="border-b border-slate-800 align-top last:border-b-0">
              {row.map((cell, i) => (
                <td
                  key={`${row[0]}-${i}`}
                  className={`py-2.5 pr-3 ${
                    i === 0
                      ? "font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500"
                      : i === hot
                        ? "font-serif text-[12px] text-teal-100"
                        : "font-serif text-[12px] text-slate-300"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashCards({ items }) {
  if (!items?.length) return null;
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-2">
      {items.map((mode) => (
        <div key={mode.name} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
          <p className="m-0 font-mono text-xs font-bold text-teal-300">{mode.name}</p>
          {mode.event ? (
            <>
              <p className="m-0 mt-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {mode.eventLabel || "Each event is"}
              </p>
              <p className="m-0 mt-0.5 font-mono text-[11px] text-slate-200">{mode.event}</p>
            </>
          ) : null}
          {mode.when ? (
            <>
              <p className="m-0 mt-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {mode.whenLabel || "When to use"}
              </p>
              <p className="m-0 mt-0.5 font-serif text-[12px] text-slate-400">{mode.when}</p>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ConfigBag({ bag, hot }) {
  if (!bag) return null;
  return (
    <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
      <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">{bag.title}</p>
      <p className="m-0 mt-1 font-serif text-[12px] text-slate-400">{bag.blurb}</p>
      <div className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300">
        <p className="m-0 text-slate-500">config = {"{"}</p>
        {bag.keys.map((row) => {
          const on = hot && row.path === hot;
          return (
            <p key={row.path} className={`m-0 pl-4 ${row.dim ? "text-slate-600" : on ? "text-teal-300" : "text-slate-200"}`}>
              {row.path}: {row.value}
              {row.note ? <span className="text-slate-500">  # {row.note}</span> : null}
            </p>
          );
        })}
        <p className="m-0 text-slate-500">{"}"}</p>
      </div>
    </div>
  );
}

function FrameStrip({ frames, hot, title }) {
  if (!frames?.length) return null;
  const cols = frames.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";
  return (
    <div className="mb-4">
      <p className="m-0 mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {title || "Order in RAM · get_state_history · newest first"}
      </p>
      <div className={`grid gap-2 ${cols}`}>
        {frames.map((frame) => {
          const on = hot != null && frame.i === hot;
          return (
            <div
              key={frame.i}
              className={`rounded-xl border px-3 py-2 ${on ? "border-teal-400 bg-teal-950/50" : "border-slate-700 bg-slate-900"}`}
            >
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">[{frame.i}] {frame.label}</p>
              <p className="m-0 mt-1 font-mono text-[11px] text-slate-200">{frame.msgs}</p>
              <p className="m-0 mt-0.5 font-serif text-[11px] text-slate-500">{frame.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SUBGRAPH_WALK = [
  { nodes: ["START"], edges: [], note: "Parent ticket. lookup is not fetch_status on this chain — it is a compiled graph.", ticket: { order_id: " ord-1 " } },
  { nodes: ["START", "normalize"], edges: [{ from: "START", to: "normalize" }], note: "normalize runs in the parent. The subgraph has not started.", ticket: { order_id: "ORD-1" } },
  { nodes: ["START", "normalize", "lookup"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "lookup" }], inner: { nodes: ["START"], edges: [] }, note: "Inside lookup. Parent still sees one node. This small graph is lookup_sub.", ticket: { graph: "lookup_sub", order_id: "ORD-1" } },
  { nodes: ["START", "normalize", "lookup"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "lookup" }], inner: { nodes: ["START", "fetch_status"], edges: [{ from: "START", to: "fetch_status" }] }, note: "fetch_status lives only in the subgraph. ORDERS.get(ORD-1).", ticket: { status: "shipped" } },
  { nodes: ["START", "normalize", "lookup"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "lookup" }], inner: { nodes: ["START", "fetch_status", "END"], edges: [{ from: "START", to: "fetch_status" }, { from: "fetch_status", to: "END" }] }, note: "Inner END writes status onto the parent ticket. Compile once; reuse on other flows.", ticket: { status: "shipped" } },
  { nodes: ["START", "normalize", "lookup", "format_note"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "lookup" }, { from: "lookup", to: "format_note" }], note: "Back on the parent. format_note uses the status the subgraph wrote.", ticket: { note: "ORD-1 is currently shipped" } },
  { nodes: ["START", "normalize", "lookup", "format_note", "END"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "lookup" }, { from: "lookup", to: "format_note" }, { from: "format_note", to: "END" }], note: "ORD-2 takes the same path. One ticket at a time.", ticket: { note: "ORD-1 is currently shipped" } },
];

function subgraphInnerOn(nodes, inner, name) {
  if (!nodes) return true;
  if (!nodes.includes("lookup")) return false;
  if (!inner) return true;
  return isOn(inner.nodes, name);
}

function subgraphInnerEdge(nodes, inner, from, to) {
  if (!nodes) return true;
  if (!nodes.includes("lookup")) return false;
  if (!inner) return true;
  return edgeOn(inner.edges, from, to);
}

function InnerLink({ on }) {
  return <div className={`h-px min-w-8 flex-1 ${on ? "bg-teal-400" : "bg-slate-500"}`} />;
}

function SubgraphLesson() {
  const { step, setStep, playing, setPlaying, beat } = useWalk(SUBGRAPH_WALK, "subgraph");
  const nodes = beat?.nodes;
  const edges = beat?.edges;
  const inner = beat?.inner;
  const lookupOn = isOn(nodes, "lookup");

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">15 · Subgraphs</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">
        lookup is a compiled graph used as one parent node. The box is that graph.
      </p>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        <div className="flex flex-col items-center">
          <NodeBox name="START" on={isOn(nodes, "START")} meaning="parent entry" />
          <Stem on={edgeOn(edges, "START", "normalize")} />
          <NodeBox name="normalize" on={isOn(nodes, "normalize")} meaning="strip / upper the id" />
          <Stem on={edgeOn(edges, "normalize", "lookup")} />
          <div
            className={`w-full rounded-2xl border-2 border-dashed px-3 py-3 sm:px-4 sm:py-4 ${
              lookupOn
                ? "border-teal-400 bg-teal-950/40 ring-2 ring-teal-400/20"
                : "border-slate-600 bg-slate-950/50"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className={`m-0 font-mono text-sm font-semibold ${lookupOn ? "text-teal-100" : "text-slate-400"}`}>lookup</p>
              <p className={`m-0 font-mono text-[10px] font-bold uppercase tracking-wider ${lookupOn ? "text-amber-200" : "text-slate-500"}`}>
                compiled subgraph
              </p>
            </div>
            <div className="flex w-full items-center gap-2 py-2">
              <NodeBox name="START" on={subgraphInnerOn(nodes, inner, "START")} meaning="order_id in" />
              <InnerLink on={subgraphInnerEdge(nodes, inner, "START", "fetch_status")} />
              <NodeBox name="fetch_status" on={subgraphInnerOn(nodes, inner, "fetch_status")} meaning="ORDERS.get" />
              <InnerLink on={subgraphInnerEdge(nodes, inner, "fetch_status", "END")} />
              <NodeBox name="END" on={subgraphInnerOn(nodes, inner, "END")} meaning="status out" />
            </div>
          </div>
          <Stem on={edgeOn(edges, "lookup", "format_note")} />
          <NodeBox name="format_note" on={isOn(nodes, "format_note")} meaning="write the note" />
          <Stem on={edgeOn(edges, "format_note", "END")} />
          <NodeBox name="END" on={isOn(nodes, "END")} meaning="parent exit" />
        </div>
        <MermaidDiagram
          spec={{
            edges: [
              { from: "START", to: "normalize" },
              { from: "normalize", to: "lookup" },
              { from: "lookup", to: "fetch_status" },
              { from: "fetch_status", to: "lookup END" },
              { from: "lookup END", to: "format_note" },
              { from: "format_note", to: "END" },
            ],
          }}
        />
        <WalkBar
          walk={SUBGRAPH_WALK}
          step={step}
          setStep={setStep}
          playing={playing}
          setPlaying={setPlaying}
          idleNote="The dashed box is lookup_sub. Press Play to walk through it."
        />
      </div>
    </div>
  );
}

function MiniChain({ steps }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {steps.map((step, i) => (
        <span key={step} className="flex items-center gap-1">
          <span className="rounded-md border border-slate-600 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-200">{step}</span>
          {i < steps.length - 1 ? <span className="font-mono text-[10px] text-slate-500">→</span> : null}
        </span>
      ))}
    </div>
  );
}

const WHEN_PLACES = [
  {
    name: "LLM app",
    build: false,
    when: "FAQs, chitchat, policy with no live data",
    skip: "Needs ORDERS or a tool",
    steps: ["prompt", "one answer"],
    walk: [
      { note: "Same question: Can I get a refund for ORD-1?" },
      { note: "One prompt, one answer. No tools. Cannot check the real order. This is not an agent." },
    ],
  },
  {
    name: "Workflow",
    build: false,
    when: "Steps already known: invoices, ETL, this chain",
    skip: "Customer might only say hello",
    steps: ["normalize", "lookup", "format"],
    walk: [
      { note: "You already know the path: normalize → lookup → format. Write it as a workflow." },
      { note: "Every ticket runs every step. That is the whiteboard test — do not start with an agent." },
    ],
  },
  {
    name: "Agent",
    build: true,
    when: "Tool choice unclear: status, list, refund, tracking",
    skip: "Always the same one tool in one order",
    steps: ["chatbot", "tools", "chatbot"],
    walk: [
      { note: "The path is not known up front. The model picks lookup, refund policy, both, or neither." },
      { note: "Build an agent here. An agent that always calls one tool in one order is a workflow with extra ways to fail." },
    ],
  },
];

function WhenToBuild({ caseIdx, setCaseIdx }) {
  const place = WHEN_PLACES[caseIdx];
  const { step, setStep, playing, setPlaying } = useWalk(place.walk, `when-${caseIdx}`);
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">01 · When to build an agent</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">
        Same refund-ORD-1 question. Three places. An agent is only the third.
      </p>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {WHEN_PLACES.map((item, i) => {
          const on = i === caseIdx;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setCaseIdx(i)}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                on ? "border-teal-400 bg-teal-950/40 ring-1 ring-teal-400/30" : "border-slate-700 bg-slate-900/80 hover:bg-slate-800"
              }`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className={`m-0 font-mono text-xs font-bold ${on ? "text-teal-200" : "text-slate-300"}`}>{item.name}</p>
                <p className={`m-0 font-mono text-[10px] uppercase tracking-wider ${item.build ? "text-amber-200" : "text-slate-500"}`}>
                  {item.build ? "build here" : "not here"}
                </p>
              </div>
              <MiniChain steps={item.steps} />
              <p className="m-0 mt-3 font-serif text-[12px] text-slate-300">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">When · </span>
                {item.when}
              </p>
              <p className="m-0 mt-1 font-serif text-[12px] text-slate-500">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">Not · </span>
                {item.skip}
              </p>
            </button>
          );
        })}
      </div>
      <WalkBar
        walk={place.walk}
        step={step}
        setStep={setStep}
        playing={playing}
        setPlaying={setPlaying}
        idleNote="Press a place, then Play. The diagrams are the decision. This lesson does not need a program."
      />
    </div>
  );
}

function HumanSeat({ on }) {
  return (
    <div
      className={`min-w-[6.5rem] rounded-full border-2 px-3 py-2 text-center ${
        on
          ? "border-amber-400 bg-amber-950 text-amber-100 ring-2 ring-amber-400/30"
          : "border-slate-600 bg-slate-950/70 text-slate-500"
      }`}
    >
      <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider">human</p>
      <p className="m-0 mt-0.5 font-serif text-[10px] leading-snug opacity-80">approves refund</p>
    </div>
  );
}

const HITL_CASES = [
  {
    name: "status (no pause)",
    walk: [
      { nodes: ["START"], seat: false, tool: null, note: "Status of ORD-1. That is lookup, not a refund.", ticket: { question: "Status of ORD-1?" } },
      { nodes: ["START", "chatbot"], seat: false, tool: null, note: "chatbot plans lookup_order. The person is not in this path." },
      { nodes: ["START", "chatbot", "tools"], seat: false, tool: "lookup", note: "lookup_order runs inside tools. No pause." },
      { nodes: ["START", "chatbot", "tools", "END"], seat: false, tool: "lookup", note: "ORD-1 is shipped. The human seat stayed empty.", ticket: { print: "status (no pause): shipped" } },
    ],
  },
  {
    name: "refund (pause)",
    walk: [
      { nodes: ["START"], seat: false, tool: null, note: "Please refund ORD-1. Same mermaid as status — chatbot ⇄ tools.", ticket: { question: "Please refund ORD-1." } },
      { nodes: ["START", "chatbot"], seat: false, tool: null, note: "chatbot plans request_refund. Still no new graph node." },
      { nodes: ["START", "chatbot", "tools"], seat: true, tool: "refund", note: "The person sits here, inside request_refund, on the tools node. Lookup would have run; this one waits.", ticket: { paused: "please_approve refund ORD-1" } },
      { nodes: ["START", "chatbot", "tools", "END"], seat: false, tool: "refund", note: "Command(resume=True) on the same thread. The question is not sent again.", ticket: { print: "resumed: Refund approved for ORD-1" } },
    ],
  },
];

function HitlLesson({ caseIdx, setCaseIdx }) {
  const active = HITL_CASES[caseIdx];
  const { step, setStep, playing, setPlaying, beat } = useWalk(active.walk, `hitl-${caseIdx}`);
  const nodes = beat?.nodes;
  const toolsOn = isOn(nodes, "tools");
  const lookupOn = toolsOn && beat?.tool === "lookup";
  const refundOn = toolsOn && beat?.tool === "refund";
  const seatOn = Boolean(beat?.seat);

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">02 · Human in the loop</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">
        Same agent mermaid as the loop. The human is not a node — they sit inside request_refund on tools.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {HITL_CASES.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={() => setCaseIdx(i)}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 font-sans text-xs font-semibold transition-all ${
              i === caseIdx
                ? "border-teal-400 bg-teal-400 text-slate-950"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        <div className="flex flex-col items-center">
          <NodeBox name="START" on={isOn(nodes, "START")} meaning="ticket in" />
          <Stem on={isOn(nodes, "chatbot")} />
          <NodeBox name="chatbot" on={isOn(nodes, "chatbot")} meaning="picks a tool" />
          <div className="mt-1 flex w-full max-w-xl flex-col items-center">
            <div className="h-5 w-px bg-slate-500" />
            <TBar count={2} />
            <div className="flex w-full">
              <div className="flex flex-1 flex-col items-center">
                <div className={`h-5 w-px ${toolsOn ? "bg-teal-400" : "bg-slate-500"}`} />
                <span className={`mb-1 rounded px-1.5 py-0.5 font-mono text-[10px] ${toolsOn ? "bg-teal-400/20 text-teal-200" : "bg-slate-800 text-slate-500"}`}>
                  tool_calls
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center">
                <div className={`h-5 w-px ${isOn(nodes, "END") ? "bg-teal-400" : "bg-slate-500"}`} />
                <span className={`mb-1 rounded px-1.5 py-0.5 font-mono text-[10px] ${isOn(nodes, "END") ? "bg-teal-400/20 text-teal-200" : "bg-slate-800 text-slate-500"}`}>
                  done
                </span>
              </div>
            </div>
          </div>
          <div className="flex w-full max-w-xl items-stretch justify-center gap-3">
            <div
              className={`min-w-0 flex-1 rounded-2xl border-2 border-dashed px-3 py-3 ${
                toolsOn ? "border-teal-400 bg-teal-950/30" : "border-slate-600 bg-slate-950/40"
              }`}
            >
              <p className={`m-0 mb-3 font-mono text-xs font-semibold ${toolsOn ? "text-teal-100" : "text-slate-400"}`}>tools</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <NodeBox name="lookup_order" on={lookupOn} meaning="runs" />
                <NodeBox name="request_refund" on={refundOn} meaning="may pause" />
                <HumanSeat on={seatOn} />
              </div>
            </div>
            <div className="flex items-center">
              <NodeBox name="END" on={isOn(nodes, "END")} meaning="reply" />
            </div>
          </div>
          <p className="m-0 mt-3 font-mono text-[11px] text-slate-400">↺ tools → chatbot · result</p>
        </div>
        <MermaidDiagram
          spec={{
            edges: [
              { from: "START", to: "chatbot" },
              { from: "chatbot", to: "tools", label: "tool_calls" },
              { from: "tools", to: "chatbot", label: "result" },
              { from: "chatbot", to: "END", label: "no tool_calls" },
            ],
          }}
        />
        <WalkBar
          walk={active.walk}
          step={step}
          setStep={setStep}
          playing={playing}
          setPlaying={setPlaying}
          idleNote="The compiled mermaid is chatbot ⇄ tools. Press Play to see where the person sits."
        />
      </div>
    </div>
  );
}

const LOOP_TABLE = {
  title: "tools_condition on chatbot",
  highlight: 1,
  headers: ["After chatbot", "Next hop"],
  rows: [
    ["Last message has tool_calls", "tools"],
    ["Last message has no tool_calls", "END"],
  ],
};

const LOOP_WALK = [
  { nodes: ["START"], edges: [], note: "Last lesson always did chatbot → tools → END. No way back. This graph has a double arrow: chatbot ↔ tools." },
  { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "First hop: chatbot writes tool_calls. tools_condition: if there are tool_calls, go to tools." },
  {
    nodes: ["START", "chatbot", "tools"],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools" },
      { from: "tools", to: "chatbot" },
    ],
    note: "ToolNode runs lookup_order(ORD-1) → shipped. The ↑ result edge sends that ToolMessage back to chatbot.",
  },
  {
    nodes: ["START", "chatbot", "tools", "END"],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools" },
      { from: "tools", to: "chatbot" },
      { from: "chatbot", to: "END" },
    ],
    note: "Second hop: chatbot writes the reply. No tool_calls. tools_condition: if not, go to END.",
  },
];

function LoopDoubleArrow({ downOn, upOn }) {
  const on = downOn || upOn;
  return (
    <div className="flex flex-col items-center py-1">
      <Label text="↓ tool_calls" on={downOn} />
      <p className={`m-0 my-1 font-mono text-4xl leading-none ${on ? "text-teal-300" : "text-slate-500"}`}>↕</p>
      <Label text="↑ result" on={upOn} />
    </div>
  );
}

function AgentLoopLesson() {
  const { step, setStep, playing, setPlaying, beat } = useWalk(LOOP_WALK, "loop");
  const nodes = beat?.nodes;
  const edges = beat?.edges;
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">07 · Agent loops</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">
        chatbot ↔ tools. tools_condition on chatbot: if there are tool_calls, go to tools; if not, go to END.
      </p>
      <CompareTable table={LOOP_TABLE} />
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        <div className="flex flex-col items-center">
          <NodeBox name="START" on={isOn(nodes, "START")} meaning="Status of ORD-1?" />
          <Stem on={edgeOn(edges, "START", "chatbot")} />
          <NodeBox name="chatbot" on={isOn(nodes, "chatbot")} meaning="tools_condition reads this message" />
          <div className="mt-1 flex w-full max-w-lg flex-col items-center">
            <div className="h-5 w-px bg-slate-500" />
            <TBar count={2} />
            <div className="flex w-full">
              <div className="flex flex-1 flex-col items-center">
                <LoopDoubleArrow downOn={edgeOn(edges, "chatbot", "tools")} upOn={edgeOn(edges, "tools", "chatbot")} />
                <NodeBox name="tools" on={isOn(nodes, "tools")} meaning="lookup_order" />
              </div>
              <div className="flex flex-1 flex-col items-center">
                <Stem on={edgeOn(edges, "chatbot", "END")} label="no tool_calls" />
                <NodeBox name="END" on={isOn(nodes, "END")} meaning="the reply" />
              </div>
            </div>
          </div>
        </div>
        <MermaidDiagram
          spec={{
            edges: [
              { from: "START", to: "chatbot" },
              { from: "chatbot", to: "tools", label: "tool_calls" },
              { from: "tools", to: "chatbot", label: "result" },
              { from: "chatbot", to: "END", label: "no tool_calls" },
            ],
          }}
        />
        <WalkBar
          walk={LOOP_WALK}
          step={step}
          setStep={setStep}
          playing={playing}
          setPlaying={setPlaying}
          idleNote="The double arrow is chatbot ↔ tools. Press Play."
        />
      </div>
    </div>
  );
}

function MiddlewareCard({ spec }) {
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">{spec.kicker}</p>
      <p className="mt-1 mb-3 font-serif text-lg text-slate-200">{spec.caption}</p>
      <p className="mb-4 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-[11px] text-teal-100">{spec.sits}</p>
      <CompareTable table={spec.table} />
    </div>
  );
}

export function GraphWalk({ id }) {
  const spec = DIAGRAMS[id];
  const [caseIdx, setCaseIdx] = useState(0);
  const [seenId, setSeenId] = useState(id);

  if (seenId !== id) {
    setSeenId(id);
    setCaseIdx(0);
  }

  const active = spec?.cases?.[caseIdx];
  const chart = active?.layers ? { ...spec, ...active } : spec;
  const walk = active?.walk || spec?.walk || [];
  const { step, setStep, playing, setPlaying, beat } = useWalk(walk, `${id}-${caseIdx}`);

  if (!spec) return null;
  if (spec.kind === "middleware") return <MiddlewareCard spec={spec} />;
  if (spec.kind === "why") return <WhyLangGraph />;
  if (spec.kind === "reducers") return <StateReducers caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;
  if (spec.kind === "streaming") return <StreamModes caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;
  if (spec.kind === "subgraph") return <SubgraphLesson />;
  if (spec.kind === "loop") return <AgentLoopLesson />;
  if (spec.kind === "when") return <WhenToBuild caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;
  if (spec.kind === "hitl") return <HitlLesson caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">{spec.kicker}</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">{spec.caption}</p>
      <CompareTable table={spec.compareTable} />
      <DashCards items={spec.dashboard} />
      <ConfigBag bag={spec.configBag} hot={beat?.hot} />
      <FrameStrip frames={spec.frames} hot={beat?.frame} title={spec.framesTitle} />
      {spec.cases?.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {spec.cases.map((c, i) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCaseIdx(i)}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 font-sans text-xs font-semibold transition-all ${
                i === caseIdx
                  ? "border-teal-400 bg-teal-400 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        <FlowChart spec={chart} activeNodes={beat?.nodes} activeEdges={beat?.edges} />
        <WalkBar walk={walk} step={step} setStep={setStep} playing={playing} setPlaying={setPlaying} idleNote={spec.idleNote} />
      </div>
    </div>
  );
}

export const MERMAID_DIAGRAMS = DIAGRAMS;
