import { useEffect, useState } from "react";

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
    caption: "classify writes intent into state. The edge only reads that field.",
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
  loop: { kind: "loop" },
  parallel: {
    kicker: "07 · Parallel fixed edges",
    caption: "Linear is START → A → B. Parallel is two edges from START: A and B run together, then merge waits for both.",
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
    walk: [
      { nodes: ["START"], edges: [], note: "Definition: two add_edge from START. Both nodes run at the same time. Not A then B, and not Send (one worker per list item).", ticket: { order_id: " ord-1 " } },
      { nodes: ["START", "normalize", "check_tier"], edges: [{ from: "START", to: "normalize" }, { from: "START", to: "check_tier" }], note: "Branches do not see each other. check_tier still uses the raw order_id. Both must finish before merge.", ticket: { normalized_id: "ORD-1", tier: "VIP" } },
      { nodes: ["START", "normalize", "check_tier", "merge"], edges: [{ from: "START", to: "normalize" }, { from: "START", to: "check_tier" }, { from: "normalize", to: "merge" }, { from: "check_tier", to: "merge" }], note: "merge waits, then writes the answer from both results. notes concatenate with Annotated[list, add].", ticket: { answer: "🌟 VIP | Order ORD-1 → shipped" } },
      { nodes: ["START", "normalize", "check_tier", "merge", "END"], edges: [{ from: "START", to: "normalize" }, { from: "START", to: "check_tier" }, { from: "normalize", to: "merge" }, { from: "check_tier", to: "merge" }, { from: "merge", to: "END" }], note: "Use this for two independent checks. Next lesson's Send is for a list of order ids at runtime.", ticket: { answer: "🌟 VIP | Order ORD-1 → shipped" } },
    ],
  },
  streaming: { kind: "streaming" },
  thinking: {
    kicker: "09 · Thinking stream",
    caption: "Same agent loop mermaid as lesson 06. stream_mode is a list, so each event is (mode, data).",
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
      { name: "updates", event: "{node_name: partial update}", when: "Thinking room: every node reports — chatbot, then tools" },
      { name: "messages", event: "(token_chunk, meta) from the LLM", when: "The final reply you send — typed answer tokens" },
    ],
    walk: [
      { nodes: ["START"], edges: [], note: "stream_mode=['updates', 'messages']. One mode alone cannot show a tool spinner and live tokens.", ticket: { stream: "for mode, event in app.stream(..., stream_mode=['updates', 'messages'])" } },
      { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "updates fires first: which node just ran. chatbot may emit tool_calls for ORD-1.", ticket: { print: "[thinking] step=chatbot" } },
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "updates: tools ran lookup_order. A support UI can show a spinner here.", ticket: { print: "[thinking] step=tools" } },
      { nodes: ["START", "chatbot", "tools", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }, { from: "chatbot", to: "END" }], note: "messages: tokens of the answer. Still no thread memory — that is persistence.", ticket: { tokens: "The status of ORD-1 is shipped" } },
    ],
  },
  persistence: {
    kicker: "10 · Persistence",
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
    kicker: "11 · RunnableConfig",
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
    kicker: "12 · Durable checkpointers",
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
    kicker: "13 · get_state / update_state",
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
  mapreduce: {
    kicker: "15 · Map-reduce with Send",
    caption: "Compiled mermaid has two nodes: work and reduce. plan is the routing function on START, not a node.",
    direction: "TD",
    layers: [["START"], ["work"], ["reduce"], ["END"]],
    edges: [
      { from: "START", to: "work", label: "plan → Send" },
      { from: "work", to: "reduce" },
      { from: "reduce", to: "END" },
    ],
    meanings: {
      START: "order_ids list",
      work: "one node, many Sends",
      reduce: "join notes",
      END: "one summary",
    },
    dashboard: [
      { name: "compiled graph", eventLabel: "Nodes", event: "work, reduce", whenLabel: "Edges", when: "START -plan→ work → reduce → END. plan is add_conditional_edges(START, plan, ['work'])." },
      { name: "runtime Send", eventLabel: "What runs", event: "one work worker per order id", whenLabel: "Merge", when: "Annotated[list, add] concatenates notes. Then reduce writes summary." },
    ],
    cases: [
      {
        name: "compiled graph",
        walk: [
          { nodes: ["START"], edges: [], note: "plan is not a node. It is the function on START that returns Send objects.", ticket: { order_ids: "ORD-1, ORD-2, ORD-3" } },
          { nodes: ["START", "work"], edges: [{ from: "START", to: "work" }], note: "add_conditional_edges(START, plan, ['work']). Each Send('work', {order_id}) is one worker of the same node.", ticket: { node: "work" } },
          { nodes: ["START", "work", "reduce"], edges: [{ from: "START", to: "work" }, { from: "work", to: "reduce" }], note: "Every worker finishes, then reduce. notes accumulate with Annotated[list, add].", ticket: { notes: "ORD-1=shipped; ORD-2=pending; ORD-3=cancelled" } },
          { nodes: ["START", "work", "reduce", "END"], edges: [{ from: "START", to: "work" }, { from: "work", to: "reduce" }, { from: "reduce", to: "END" }], note: "summary is one string. Press runtime Send to see the three workers the mermaid collapses.", ticket: { summary: "ORD-1=shipped; ORD-2=pending; ORD-3=cancelled" } },
        ],
      },
      {
        name: "runtime Send",
        layers: [["START"], ["work ORD-1", "work ORD-2", "work ORD-3"], ["reduce"], ["END"]],
        edges: [
          { from: "START", to: "work ORD-1", label: "Send" },
          { from: "START", to: "work ORD-2", label: "Send" },
          { from: "START", to: "work ORD-3", label: "Send" },
          { from: "work ORD-1", to: "reduce" },
          { from: "work ORD-2", to: "reduce" },
          { from: "work ORD-3", to: "reduce" },
          { from: "reduce", to: "END" },
        ],
        meanings: {
          START: "plan() returns Sends",
          "work ORD-1": "shipped",
          "work ORD-2": "pending",
          "work ORD-3": "cancelled",
          reduce: "join notes",
          END: "one summary",
        },
        walk: [
          { nodes: ["START"], edges: [], note: "Customer asks about three ids at once. A single-order path cannot do this in parallel.", ticket: { order_ids: "ORD-1, ORD-2, ORD-3" } },
          { nodes: ["START", "work ORD-1", "work ORD-2", "work ORD-3"], edges: [{ from: "START", to: "work ORD-1" }, { from: "START", to: "work ORD-2" }, { from: "START", to: "work ORD-3" }], note: "Same work function, three items, in parallel. Not three add_edge calls — Send at runtime.", ticket: { notes: "three worker writes" } },
          { nodes: ["START", "work ORD-1", "work ORD-2", "work ORD-3", "reduce"], edges: [{ from: "START", to: "work ORD-1" }, { from: "START", to: "work ORD-2" }, { from: "START", to: "work ORD-3" }, { from: "work ORD-1", to: "reduce" }, { from: "work ORD-2", to: "reduce" }, { from: "work ORD-3", to: "reduce" }], note: "reduce writes one support summary from notes.", ticket: { summary: "ORD-1=shipped; ORD-2=pending; ORD-3=cancelled" } },
          { nodes: ["START", "work ORD-1", "work ORD-2", "work ORD-3", "reduce", "END"], edges: [{ from: "START", to: "work ORD-1" }, { from: "START", to: "work ORD-2" }, { from: "START", to: "work ORD-3" }, { from: "work ORD-1", to: "reduce" }, { from: "work ORD-2", to: "reduce" }, { from: "work ORD-3", to: "reduce" }, { from: "reduce", to: "END" }], note: "If order 2 depended on order 1, this would be the wrong pattern — use a sequence.", ticket: { summary: "ORD-1=shipped; ORD-2=pending; ORD-3=cancelled" } },
        ],
      },
    ],
  },
  when: { kind: "when" },
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
    kicker: "06 · Debugging agents",
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

const LOOP_CASES = [
  {
    name: "1 · basic loop",
    kicker: "06 · Agent loops",
    caption: "Part 1 is create_agent with the lid off. Same cycle: chatbot ↔ ToolNode until the model stops.",
    direction: "TD",
    layers: [["START"], ["chatbot"], ["tools", "END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools", label: "tool_calls" },
      { from: "chatbot", to: "END", label: "done" },
    ],
    backEdges: [{ from: "chatbot", to: "tools", label: "result" }],
    meanings: {
      START: "Status of ORD-1?",
      chatbot: "tools_condition",
      tools: "lookup_order",
      END: "reply",
    },
    walk: [
      { nodes: ["START"], edges: [], note: "Tool Calling already ran this: create_agent loops model → tool → result → model. That function compiles this graph behind the scenes. You are looking at the same cycle." },
      { nodes: ["START", "chatbot"], edges: [{ from: "START", to: "chatbot" }], note: "chatbot may emit tool_calls. tools_condition is the built-in stop create_agent uses: continue if tool_calls exist, else END." },
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "lookup_order(ORD-1) → shipped. Result goes back to chatbot. Same back-and-forth as create_agent.", ticket: { order: "ORD-1", tool: "lookup_order" } },
      { nodes: ["START", "chatbot", "tools", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }, { from: "chatbot", to: "END" }], note: "No more tool_calls → END. Parts 2 and 3 add desks create_agent does not expose. recursion_limit=10 still caps a runaway cycle." },
    ],
  },
  {
    name: "2 · break after 3",
    kicker: "06 · Agent loops",
    caption: "Part 2: should_continue() on chatbot. Stop if no tool_calls, or if attempts ≥ 3.",
    direction: "TD",
    layers: [["START"], ["chatbot"], ["tools", "give_up", "END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools", label: "attempts < 3" },
      { from: "chatbot", to: "give_up", label: "attempts ≥ 3" },
      { from: "chatbot", to: "END", label: "no tool_calls" },
      { from: "give_up", to: "END" },
    ],
    backEdges: [{ from: "chatbot", to: "tools", label: "result" }],
    meanings: {
      START: "entry",
      chatbot: "attempts += 1",
      tools: "lookup",
      give_up: "sorry, 3 tries",
      END: "exit",
    },
    walk: [
      { nodes: ["START"], edges: [], note: "tools_condition cannot cap retries. chatbot_with_counter writes attempts. should_continue reads that field.", ticket: { attempts: 0 } },
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "Has tool_calls and attempts=1 < 3 → tools. Then tools → chatbot again.", ticket: { attempts: 1 } },
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "Still calling tools. attempts=2. Budget-aware agents stop here next time.", ticket: { attempts: 2 } },
      { nodes: ["START", "chatbot", "give_up"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "give_up" }], note: "attempts ≥ 3 → give_up, not tools. The branch is on chatbot, not on the tools node.", ticket: { attempts: 3 } },
      { nodes: ["START", "chatbot", "give_up", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "give_up" }, { from: "give_up", to: "END" }], note: "give_up writes the sorry message, then END. Use this to prevent infinite loops." },
    ],
  },
  {
    name: "3 · error + fallback",
    kicker: "06 · Agent loops",
    caption: "Part 3: tools_condition still leaves chatbot. After tools, route_after_tools retries or falls back.",
    direction: "TD",
    layers: [["START"], ["chatbot"], ["tools"], ["fallback"], ["END"]],
    edges: [
      { from: "START", to: "chatbot" },
      { from: "chatbot", to: "tools", label: "tool_calls" },
      { from: "tools", to: "fallback", label: "retry limit" },
      { from: "fallback", to: "END" },
    ],
    backEdges: [{ from: "chatbot", to: "tools", label: "success" }],
    side: "error and retries < 2",
    sideNote: "route_after_tools sends the ticket back to tools. After 2 failures → fallback.",
    meanings: {
      START: "Status of ORD-1?",
      chatbot: "tools_condition",
      tools: "flaky_lookup",
      END: "clean reply",
      fallback: "system unavailable",
    },
    walk: [
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "flaky_lookup raises ~50% of the time. safe_tools catches it and writes error + retries.", ticket: { error: "API connection failed", retries: 1 } },
      { nodes: ["START", "chatbot", "tools"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }], note: "retries < 2 → tools again. Same node, another attempt. Not give_up from Part 2.", ticket: { error: "API connection failed", retries: 1 } },
      { nodes: ["START", "chatbot", "tools", "fallback"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }, { from: "tools", to: "fallback" }], note: "retries hit 2. route_after_tools returns fallback, not chatbot.", ticket: { retries: 2 } },
      { nodes: ["START", "chatbot", "tools", "fallback", "END"], edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "tools" }, { from: "tools", to: "fallback" }, { from: "fallback", to: "END" }], note: "fallback tells the customer the system is unavailable. Production loops retry, then have a desk that is not another tool call." },
    ],
  },
];

function AgentLoop({ caseIdx, setCaseIdx }) {
  const spec = LOOP_CASES[caseIdx];
  const { step, setStep, playing, setPlaying, beat } = useWalk(spec.walk, `loop-${caseIdx}`);
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">{spec.kicker}</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">{spec.caption}</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {LOOP_CASES.map((c, i) => (
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
        <FlowChart spec={spec} activeNodes={beat?.nodes} activeEdges={beat?.edges} />
        <WalkBar
          walk={spec.walk}
          step={step}
          setStep={setStep}
          playing={playing}
          setPlaying={setPlaying}
          idleNote="Press Play on each part. The three graphs in the file are not the same picture."
        />
      </div>
    </div>
  );
}

function WhyLangGraph() {
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">01 · Why LangGraph</p>
      <p className="mt-1 mb-5 font-serif text-lg text-slate-200">
        A chain is linear — A → B → C → stop. LangGraph is for when a ticket needs more than a straight line.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
          <p className="m-0 mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">Chain</p>
          <div className="flex flex-col items-center py-2">
            {["A", "B", "C", "stop"].map((name, i, all) => (
              <div key={name} className="flex flex-col items-center">
                <div className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 font-mono text-xs font-semibold text-slate-200">
                  {name}
                </div>
                {i < all.length - 1 ? <div className="h-6 w-px bg-slate-500" /> : null}
              </div>
            ))}
          </div>
          <p className="m-0 text-center font-serif text-sm text-slate-400">normalize → lookup → reply → stop. Cannot go back.</p>
        </div>
        <div className="rounded-xl border border-teal-800/80 bg-slate-900/80 p-4">
          <p className="m-0 mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-teal-300">Graph</p>
          <div className="flex flex-col items-center py-1">
            <NodeBox name="START" on meaning="entry" />
            <div className="h-5 w-px bg-teal-400" />
            <NodeBox name="node" on meaning="reads / writes the ticket" />
            <div className="flex w-full max-w-xs flex-col items-center">
              <div className="h-5 w-px bg-teal-400" />
              <TBar count={2} />
              <div className="flex w-full">
                <div className="flex flex-1 flex-col items-center">
                  <div className="h-5 w-px bg-teal-400" />
                  <span className="mb-1 rounded bg-teal-400/20 px-1.5 py-0.5 font-mono text-[10px] text-teal-200">branch</span>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <div className="h-5 w-px bg-teal-400" />
                  <span className="mb-1 rounded bg-teal-400/20 px-1.5 py-0.5 font-mono text-[10px] text-teal-200">branch</span>
                </div>
              </div>
            </div>
            <div className="flex w-full max-w-xs">
              <div className="flex flex-1 justify-center">
                <NodeBox name="left" on meaning="one desk" />
              </div>
              <div className="flex flex-1 justify-center">
                <NodeBox name="right" on meaning="other desk" />
              </div>
            </div>
            <div className="flex w-full max-w-xs flex-col items-center">
              <div className="flex w-full">
                <div className="flex flex-1 flex-col items-center">
                  <div className="h-5 w-px bg-teal-400" />
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <div className="h-5 w-px bg-teal-400" />
                </div>
              </div>
              <TBar count={2} />
              <div className="h-5 w-px bg-teal-400" />
            </div>
            <NodeBox name="END" on meaning="exit" />
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">Cycles</p>
          <p className="m-0 mt-1 font-serif text-sm text-slate-300">Go back. Retry lookup. Agent ↔ tools.</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">Branching</p>
          <p className="m-0 mt-1 font-serif text-sm text-slate-300">Pick the next desk from ticket state.</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">Shared state</p>
          <p className="m-0 mt-1 font-serif text-sm text-slate-300">Many nodes read and write the same ticket fields.</p>
        </div>
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
    START: "input message",
    chatbot: "model writes",
    END: "finished ticket",
  },
};

const STREAM_MODES = [
  {
    name: "updates",
    event: "{node_name: partial update}",
    when: "Thinking room: every node tells the user it just ran",
    walk: [
      {
        nodes: ["START"],
        edges: [],
        note: "updates is the thinking stream. Each event is keyed by the node that just ran — that is what you show the user as thinking.",
        ticket: { to_user: "thinking: which node is working" },
      },
      {
        nodes: ["START", "chatbot"],
        edges: [{ from: "START", to: "chatbot" }],
        note: "This graph only has chatbot, so you see {'chatbot': {'messages': [...]}} — the NEW bit that node returned. Next lesson, tools will send a thinking event too.",
        ticket: { event: "{'chatbot': {'messages': [...]}}" },
      },
      {
        nodes: ["START", "chatbot", "END"],
        edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }],
        note: "Not the final reply. Thinking only. messages is the answer you send. Next lesson streams both at once.",
        ticket: { to_user: "[thinking] step=chatbot" },
      },
    ],
  },
  {
    name: "values",
    event: "full TicketState after that step",
    when: "UI that re-renders the whole ticket",
    walk: [
      {
        nodes: ["START"],
        edges: [],
        note: "stream_mode='values'. print keys and len(state['messages']) — full ticket, not a delta, not thinking, not tokens.",
        ticket: { print: "keys: ['messages'] msgs: 1" },
      },
      {
        nodes: ["START", "chatbot"],
        edges: [{ from: "START", to: "chatbot" }],
        note: "Count grows 1 → 2 because full history is included each step. The HumanMessage is still on the ticket.",
        ticket: { print: "keys: ['messages'] msgs: 2" },
      },
      {
        nodes: ["START", "chatbot", "END"],
        edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }],
        note: "Use this when a UI re-renders the whole ticket after each step.",
        ticket: { print: "keys: ['messages'] msgs: 2" },
      },
    ],
  },
  {
    name: "messages",
    event: "(token_chunk, meta) from the LLM",
    when: "The final reply you send — token by token",
    walk: [
      {
        nodes: ["START"],
        edges: [],
        note: "messages is the answer stream. Each event is (token_chunk, meta) — not a state dict, not thinking.",
        ticket: { to_user: "the reply, as it types" },
      },
      {
        nodes: ["START", "chatbot"],
        edges: [{ from: "START", to: "chatbot" }],
        note: "print(chunk.content, end='') — this is what you send the customer. Piece by piece, chat-style.",
        ticket: { tokens: "ORD-1 sh" },
      },
      {
        nodes: ["START", "chatbot", "END"],
        edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }],
        note: "The finished sentence is the final send. One mode at a time here — next lesson adds the thinking room on the same stream.",
        ticket: { tokens: "ORD-1 shipped" },
      },
    ],
  },
  {
    name: "invoke()",
    event: "one final state (not streaming)",
    when: "You only need the finished reply — no thinking, no typing",
    walk: [
      {
        nodes: ["START"],
        edges: [],
        note: "app.invoke(inputs) is not a stream. Nothing goes to the user while chatbot runs.",
        ticket: { print: "(waiting — no events)" },
      },
      {
        nodes: ["START", "chatbot"],
        edges: [{ from: "START", to: "chatbot" }],
        note: "No thinking event. No tokens. The ticket is moving, the UI is blank.",
        ticket: { print: "(still waiting)" },
      },
      {
        nodes: ["START", "chatbot", "END"],
        edges: [{ from: "START", to: "chatbot" }, { from: "chatbot", to: "END" }],
        note: "One finished ticket. Use invoke() only when you do not need a live thinking room or a typing reply.",
        ticket: { print: "one final state" },
      },
    ],
  },
];

function StreamModes({ caseIdx, setCaseIdx }) {
  const active = STREAM_MODES[caseIdx];
  const { step, setStep, playing, setPlaying, beat } = useWalk(active.walk, `streaming-${caseIdx}`);
  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">08 · Streaming</p>
      <p className="mt-1 mb-3 font-serif text-lg text-slate-200">
        updates is the thinking room: every node reports to the user. messages is the final reply you send.
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
          </button>
        ))}
      </div>
      <p className="mb-3 font-serif text-sm text-slate-400">
        Press updates, then messages. This graph only has chatbot — next lesson, tools sends thinking too.
      </p>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4">
        <FlowChart spec={STREAM_GRAPH} activeNodes={beat?.nodes} activeEdges={beat?.edges} />
        <WalkBar
          walk={active.walk}
          step={step}
          setStep={setStep}
          playing={playing}
          setPlaying={setPlaying}
          idleNote="The graph is this line. Pick a mode on the dashboard, then Play to see what print() shows."
        />
      </div>
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
  { nodes: ["START", "normalize", "lookup", "format_note", "END"], edges: [{ from: "START", to: "normalize" }, { from: "normalize", to: "lookup" }, { from: "lookup", to: "format_note" }, { from: "format_note", to: "END" }], note: "ORD-2 takes the same path. Still one ticket at a time — that is Send.", ticket: { note: "ORD-1 is currently shipped" } },
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
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">14 · Subgraphs</p>
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
        idleNote="Press a place, then Play. The diagrams are the three answers in the file — not the Python itself."
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
  if (spec.kind === "why") return <WhyLangGraph />;
  if (spec.kind === "reducers") return <StateReducers caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;
  if (spec.kind === "streaming") return <StreamModes caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;
  if (spec.kind === "loop") return <AgentLoop caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;
  if (spec.kind === "subgraph") return <SubgraphLesson />;
  if (spec.kind === "when") return <WhenToBuild caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;
  if (spec.kind === "hitl") return <HitlLesson caseIdx={caseIdx} setCaseIdx={setCaseIdx} />;

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">{spec.kicker}</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">{spec.caption}</p>
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
