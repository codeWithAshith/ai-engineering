import React from "react";
import {
  ArrowRight,
  ArrowsClockwise,
  ArrowsLeftRight,
  Brain,
  Camera,
  CheckCircle,
  Cpu,
  Cube,
  CursorClick,
  Database,
  Desktop,
  Eye,
  GearSix,
  GitBranch,
  Lightbulb,
  ListChecks,
  Lock,
  Plugs,
  Robot,
  ShieldCheck,
  SlidersHorizontal,
  TerminalWindow,
  UsersThree,
} from "@phosphor-icons/react";

// 1. LLM: Next-Token Prediction Flow
export function LlmDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Autoregressive Decoding Flow
        </span>
        <span className="font-mono text-xs text-blue-600">P(token | context)</span>
      </div>

      <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center">
        <div className="w-full md:w-1/3 rounded-lg border border-line bg-paper p-3">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Input Prompt</span>
          <span className="font-mono text-sm font-semibold text-slate-900">"The sky is"</span>
          <span className="block mt-1 font-sans text-xs text-slate-500">Tokens t₁, t₂, t₃</span>
        </div>

        <div className="text-slate-400 flex items-center justify-center">
          <ArrowRight size={20} weight="bold" className="rotate-90 md:rotate-0 text-blue-500" />
        </div>

        <div className="w-full md:w-1/3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
          <span className="font-sans text-[10px] uppercase font-bold text-blue-700 block mb-1">Transformer LLM</span>
          <span className="font-sans text-sm font-bold text-slate-900">Attention & Weights</span>
          <span className="block mt-1 font-sans text-xs text-slate-600">Computes logits over vocab</span>
        </div>

        <div className="text-slate-400 flex items-center justify-center">
          <ArrowRight size={20} weight="bold" className="rotate-90 md:rotate-0 text-emerald-500" />
        </div>

        <div className="w-full md:w-1/3 rounded-lg border border-line bg-paper p-3">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Sampled Output</span>
          <span className="font-mono text-sm font-bold text-blue-700">" blue"</span>
          <span className="block mt-1 font-sans text-xs text-slate-500">Probability: 84.2%</span>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Engineering takeaway:</strong> The model never performs a database lookup. It generates by sampling candidate tokens based on statistical probabilities. Live user data must be passed inside the prompt.
      </p>
    </div>
  );
}

// 2. PROMPT: Message Array Anatomy
export function PromptDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Prompt Anatomy: Full Message Array
        </span>
        <span className="font-mono text-xs text-slate-500">List[BaseMessage]</span>
      </div>

      <div className="mt-3.5 space-y-2 font-mono text-xs">
        <div className="rounded-lg border border-line bg-slate-50/70 p-2.5 flex items-start gap-3">
          <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">System</span>
          <div className="flex-1 font-sans">
            <div className="font-mono text-xs text-slate-800">"You are Acme support. Verify order status. Never guess dates."</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Standing instructions, persona, and tool constraints.</div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-slate-50/70 p-2.5 flex items-start gap-3">
          <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">Context</span>
          <div className="flex-1 font-sans">
            <div className="font-mono text-xs text-slate-800">"Doc chunk: Returns eligible within 30 days of shipment..."</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Injected facts retrieved from RAG or external tools.</div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-slate-50/70 p-2.5 flex items-start gap-3">
          <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">History</span>
          <div className="flex-1 font-sans">
            <div className="font-mono text-xs text-slate-800">Human: "Check ORD-102" → AI: "Sure, let me look that up."</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Prior conversational turns re-sent for multi-turn state.</div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-2.5 flex items-start gap-3">
          <span className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">Human</span>
          <div className="flex-1 font-sans">
            <div className="font-mono text-xs text-slate-900 font-semibold">"Can I get a refund if it arrived damaged?"</div>
            <div className="text-[11px] text-slate-500 mt-0.5">The current question being processed.</div>
          </div>
        </div>
      </div>

      <p className="mt-3 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Rule:</strong> "The prompt" is the total sequence passed to the API. Every character across system, context, and history consumes token budget.
      </p>
    </div>
  );
}

// 3. TOKEN: Byte-Pair Encoding
export function TokenDiagram() {
  const exampleTokens = [
    { text: "Lang", id: 18942 },
    { text: "Chain", id: 9812 },
    { text: " uses", id: 1530 },
    { text: " byte", id: 7421 },
    { text: "-pair", id: 3120 },
    { text: " encoding", id: 14092 },
    { text: " for", id: 369 },
    { text: " sub", id: 1042 },
    { text: "words", id: 8219 },
    { text: ".", id: 13 },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Byte-Pair Encoding (BPE) Subword Tokenizer
        </span>
        <span className="font-mono text-xs text-slate-500">10 Tokens ≈ 42 Bytes</span>
      </div>

      <div className="mt-3.5">
        <div className="text-xs text-slate-500 mb-2">
          Raw string: <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">"LangChain uses byte-pair encoding for subwords."</code>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {exampleTokens.map((t, idx) => (
            <div key={idx} className="flex flex-col rounded-lg border border-line bg-paper px-2 py-1 text-center">
              <span className="font-mono text-xs font-semibold text-slate-900">
                {t.text.startsWith(" ") ? `␣${t.text.slice(1)}` : t.text}
              </span>
              <span className="font-mono text-[9px] text-slate-400">ID {t.id}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600">
        <div className="rounded-lg border border-line bg-slate-50/60 p-2.5">
          <strong className="text-slate-800 block mb-0.5">1 Word ≠ 1 Token</strong>
          <span>English averages ~1.3 tokens per word. Punctuation, symbols, and non-Latin scripts take more.</span>
        </div>
        <div className="rounded-lg border border-line bg-slate-50/60 p-2.5">
          <strong className="text-slate-800 block mb-0.5">Hard Context Limits</strong>
          <span>Exceeding context length causes request errors or truncation. Budget carefully.</span>
        </div>
        <div className="rounded-lg border border-line bg-slate-50/60 p-2.5">
          <strong className="text-slate-800 block mb-0.5">Billing Currency</strong>
          <span>APIs bill per million tokens. Each turn re-bills all prior context sent in that request.</span>
        </div>
      </div>
    </div>
  );
}

// 4. CONTEXT WINDOW: Whiteboard Budget
export function ContextWindowDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Context Window: Whiteboard Budget
        </span>
        <span className="font-mono text-xs text-slate-500">Shared Input + Output Capacity</span>
      </div>

      <div className="mt-4">
        <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-100 p-1 flex gap-1 border border-line">
          <div style={{ width: "15%" }} className="h-full rounded bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">
            System (15%)
          </div>
          <div style={{ width: "40%" }} className="h-full rounded bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-800">
            Chat History (40%)
          </div>
          <div style={{ width: "25%" }} className="h-full rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
            RAG / Docs (25%)
          </div>
          <div style={{ width: "20%" }} className="h-full rounded bg-white flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
            Output Buffer (20%)
          </div>
        </div>

        <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-400 px-0.5">
          <span>0 Tokens</span>
          <span>Window Limit (e.g. 8k / 128k Tokens)</span>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
        <div className="rounded-lg border border-line bg-slate-50/60 p-2.5">
          <strong className="text-slate-800 block mb-0.5">Attention Degradation</strong>
          <span>Models can miss details placed deep in large contexts ("Lost in the Middle"). Keep prompts focused.</span>
        </div>
        <div className="rounded-lg border border-line bg-slate-50/60 p-2.5">
          <strong className="text-slate-800 block mb-0.5">Management Techniques</strong>
          <span>Use message trimming (`trim_messages`), periodic history summarization, and external stores.</span>
        </div>
      </div>
    </div>
  );
}

// 5. TOP-K
export function TopKDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Top-K Truncation Mechanism
        </span>
        <span className="font-mono text-xs text-slate-500">Hard Rank Cutoff [1..K]</span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-line bg-slate-50/60 p-3">
          <span className="font-mono text-xs font-bold text-slate-900 block mb-1">K = 1 (Strict Top)</span>
          <p className="text-slate-600 m-0">Only the single highest probability token is allowed. Output is fully deterministic, exactly like greedy decoding.</p>
        </div>
        <div className="rounded-lg border border-line bg-slate-50/60 p-3">
          <span className="font-mono text-xs font-bold text-slate-900 block mb-1">K = 40 (Typical)</span>
          <p className="text-slate-600 m-0">Only the top 40 candidates are considered. The remaining ~100k+ vocabulary tokens are discarded from the distribution.</p>
        </div>
      </div>

      <p className="mt-3 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Practical note:</strong> When `temperature = 0` is set for tool calling or agent nodes, Top-K is redundant because the top token is always selected.
      </p>
    </div>
  );
}

// 6. TOP-P
export function TopPDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Top-P (Nucleus) Cumulative Sampling
        </span>
        <span className="font-mono text-xs text-slate-500">Cumulative Mass ≤ P</span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-line bg-slate-50/60 p-3">
          <span className="font-mono text-xs font-bold text-slate-900 block mb-1">Dynamic Candidate Pool</span>
          <p className="text-slate-600 m-0">Tokens are added in order of probability until their sum reaches P (e.g. 0.90). When confident, 1–2 tokens qualify; when uncertain, many qualify.</p>
        </div>
        <div className="rounded-lg border border-line bg-slate-50/60 p-3">
          <span className="font-mono text-xs font-bold text-slate-900 block mb-1">Long-Tail Elimination</span>
          <p className="text-slate-600 m-0">The bottom 10% tail of unlikely or bizarre tokens is discarded, preventing nonsensical completions without clipping plausible alternatives.</p>
        </div>
      </div>

      <p className="mt-3 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Recommendation:</strong> Leave Top-P at provider defaults (usually 1.0 or 0.9) and control sampling behavior using Temperature.
      </p>
    </div>
  );
}

// 7. SAMPLING COMBO
export function SamplingComboDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          The 3-Step Sampling Pipeline
        </span>
        <span className="font-mono text-xs text-slate-500">Sequential Filtering</span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="rounded-lg border border-line bg-slate-50/60 p-3">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Step 01</span>
          <strong className="text-slate-900 block font-sans text-xs mb-1">Temperature</strong>
          <span className="text-slate-600">Divides raw logits by T to sharpen or flatten the probability curve.</span>
        </div>

        <div className="rounded-lg border border-line bg-slate-50/60 p-3">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Step 02</span>
          <strong className="text-slate-900 block font-sans text-xs mb-1">Top-K</strong>
          <span className="text-slate-600">Discards all candidates ranked beyond K.</span>
        </div>

        <div className="rounded-lg border border-line bg-slate-50/60 p-3">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Step 03</span>
          <strong className="text-slate-900 block font-sans text-xs mb-1">Top-P</strong>
          <span className="text-slate-600">Selects smallest set whose sum hits P, renormalizes, and samples.</span>
        </div>
      </div>

      <div className="mt-3.5 rounded-lg border border-blue-200 bg-blue-50/50 p-2.5 text-xs text-slate-700">
        <strong className="text-blue-800 font-semibold">Practical recommendation:</strong> Do not tweak all three parameters simultaneously. Set <code className="font-mono text-blue-700 font-bold">temperature=0</code> for deterministic nodes (tools, SQL, agents), <code className="font-mono text-blue-700 font-bold">0.7</code> for chat, and leave Top-K / Top-P alone.
      </div>
    </div>
  );
}

// 8. HALLUCINATION
export function HallucinationDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Grounded vs. Ungrounded Generation
        </span>
        <span className="font-mono text-xs text-slate-500">Context Verification</span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-line bg-slate-50/60 p-3">
          <span className="font-sans text-xs font-bold text-slate-900 block mb-1">❌ Ungrounded (Pure Generation)</span>
          <div className="font-mono text-[11px] bg-paper p-2 rounded border border-line text-slate-700 mt-2">
            <div>User: "Return policy for ORD-912?"</div>
            <div className="text-red-600 mt-1">AI: "You have 60 days to return." (Fabricated!)</div>
          </div>
          <p className="mt-2 text-slate-500 mb-0">Model has no access to ORD-912. Forced to predict fluent text, it generates a confident falsehood.</p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-3">
          <span className="font-sans text-xs font-bold text-blue-800 block mb-1">✓ Grounded (Tool / RAG Context)</span>
          <div className="font-mono text-[11px] bg-paper p-2 rounded border border-line text-slate-700 mt-2">
            <div>Tool: lookup_order(ORD-912) → Final Sale</div>
            <div className="text-blue-700 mt-1">AI: "ORD-912 is marked Final Sale and non-refundable."</div>
          </div>
          <p className="mt-2 text-slate-500 mb-0">Attention focuses on verified facts provided inside the prompt. Hallucination drops to near-zero.</p>
        </div>
      </div>
    </div>
  );
}

// 9. WHAT MAKES UP AN AI AGENT: Overview of 5 Areas
export function AgentPartsDiagram() {
  const parts = [
    {
      title: "The Brain",
      icon: Brain,
      tag: "Cognition",
      color: "border-indigo-200 bg-indigo-50/40 text-indigo-700",
      badgeColor: "bg-indigo-100 text-indigo-800",
      topics: [
        "AI Agent",
        "Tool Calling",
        "Agentic Loop",
        "Reasoning",
        "Planning",
      ],
    },
    {
      title: "The Body",
      icon: Robot,
      tag: "Execution",
      color: "border-sky-200 bg-sky-50/40 text-sky-700",
      badgeColor: "bg-sky-100 text-sky-800",
      topics: [
        "Harness",
        "MCP",
        "Computer Use",
        "Sandbox",
      ],
    },
    {
      title: "The Mind",
      icon: Cpu,
      tag: "Memory",
      color: "border-emerald-200 bg-emerald-50/40 text-emerald-700",
      badgeColor: "bg-emerald-100 text-emerald-800",
      topics: [
        "Context Window",
        "Context Engineering",
        "Memory",
      ],
    },
    {
      title: "The Team",
      icon: UsersThree,
      tag: "Multi-Agent",
      color: "border-amber-200 bg-amber-50/40 text-amber-700",
      badgeColor: "bg-amber-100 text-amber-800",
      topics: [
        "Sub-agent",
        "Multi-agent",
        "Orchestrator",
        "Handoff",
      ],
    },
    {
      title: "The Safety Net",
      icon: ShieldCheck,
      tag: "Reliability",
      color: "border-rose-200 bg-rose-50/40 text-rose-700",
      badgeColor: "bg-rose-100 text-rose-800",
      topics: [
        "Guardrails",
        "Human in the Loop",
        "Evals",
      ],
    },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          What Makes Up an AI Agent
        </span>
        <span className="font-mono text-xs text-blue-600">5 Core Areas</span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {parts.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="rounded-xl border border-line bg-paper p-3.5 flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 rounded-md ${p.color}`}>
                      <Icon size={16} weight="bold" />
                    </span>
                    <span className="font-sans text-xs font-extrabold text-slate-900">
                      {p.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.badgeColor}`}>
                    {p.tag}
                  </span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-700 font-sans list-none pl-0 m-0">
                  {p.topics.map((topic) => (
                    <li key={topic} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-[12px] font-medium text-slate-800">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{p.topics.length} topics</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-line bg-slate-50/70 p-2.5 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">In the following notes:</span> All five core areas — <strong>The Brain</strong>, <strong>The Body</strong>, <strong>The Mind</strong>, <strong>The Team</strong>, and <strong>The Safety Net</strong>.
      </div>
    </div>
  );
}

// 10. BRAIN - AI AGENT
export function BrainAgentDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Agent Loop Overview
        </span>
        <span className="font-mono text-xs text-blue-600">Model + Tools + Goal</span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
        <div className="rounded-lg border border-line bg-paper p-3 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">1. Input / Goal</span>
            <div className="font-mono text-xs text-slate-900 bg-slate-50 p-2 rounded border border-line">
              "Check tracking for ORD-501 and notify the customer."
            </div>
          </div>
          <p className="mt-2 mb-0 text-[11px] text-slate-500">The incoming user prompt or task.</p>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-[10px] uppercase font-bold text-indigo-700">2. The Brain (Model)</span>
              <Brain size={14} weight="bold" className="text-indigo-600" />
            </div>
            <div className="font-sans text-xs font-semibold text-slate-900">Decides what to do next:</div>
            <div className="mt-1.5 space-y-1 font-mono text-[11px] text-slate-700">
              <div className="bg-white/80 p-1.5 rounded border border-indigo-100">Need data? → Call a tool</div>
              <div className="bg-white/80 p-1.5 rounded border border-indigo-100">Have answer? → Reply to user</div>
            </div>
          </div>
          <p className="mt-2 mb-0 text-[11px] text-indigo-900/70">The model decides; it does not execute.</p>
        </div>

        <div className="rounded-lg border border-line bg-paper p-3 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">3. Actions & Environment</span>
            <div className="space-y-1.5 text-xs">
              <div className="rounded bg-sky-50 border border-sky-200 p-2 text-sky-900">
                <span className="font-bold text-[10px] block uppercase text-sky-700">Action A: Call Tool</span>
                <span className="font-mono text-[11px]">lookup_order("ORD-501")</span>
              </div>
              <div className="rounded bg-emerald-50 border border-emerald-200 p-2 text-emerald-900">
                <span className="font-bold text-[10px] block uppercase text-emerald-700">Action B: Final Reply</span>
                <span className="font-mono text-[11px]">"Your order shipped via DHL..."</span>
              </div>
            </div>
          </div>
          <p className="mt-2 mb-0 text-[11px] text-slate-500">Tool results feed back to the brain until finished.</p>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Note:</strong> An AI agent is a loop around a model that selects tools and takes actions until the goal is reached.
      </p>
    </div>
  );
}

// 11. BRAIN - TOOL CALLING
export function BrainToolCallingDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Tool Calling Flow
        </span>
        <span className="font-mono text-xs text-blue-600">Schema to Execution</span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="rounded-lg border border-line bg-slate-50/70 p-2.5">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">1. Tool Definition</span>
          <div className="font-sans font-bold text-slate-900 mb-1">Python Function</div>
          <code className="text-[11px] text-slate-700 font-mono block bg-white p-1.5 rounded border border-line">
            @tool<br />
            def refund(id: str):<br />
            &nbsp;&nbsp;"""Refund order."""
          </code>
          <p className="mt-1.5 text-[11px] text-slate-500 m-0">Schema passed to model.</p>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-2.5">
          <span className="font-mono text-[10px] uppercase font-bold text-indigo-500 block mb-1">2. Model JSON</span>
          <div className="font-sans font-bold text-slate-900 mb-1">Structured Arguments</div>
          <code className="text-[11px] text-indigo-900 font-mono block bg-white p-1.5 rounded border border-indigo-100">
            tool_calls: [<br />
            &nbsp;&nbsp;{"{"}name: "refund",<br />
            &nbsp;&nbsp;&nbsp;args: {"{id: '91'}"}{"}"}<br />
            ]
          </code>
          <p className="mt-1.5 text-[11px] text-indigo-800 m-0">Model outputs parameters.</p>
        </div>

        <div className="rounded-lg border border-line bg-slate-50/70 p-2.5">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">3. Host App</span>
          <div className="font-sans font-bold text-slate-900 mb-1">Python Runs Code</div>
          <code className="text-[11px] text-slate-700 font-mono block bg-white p-1.5 rounded border border-line">
            # App executes:<br />
            res = refund(id="91")<br />
            # res = {"{"}status: 200{"}"}
          </code>
          <p className="mt-1.5 text-[11px] text-slate-500 m-0">Executed in your environment.</p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
          <span className="font-mono text-[10px] uppercase font-bold text-emerald-600 block mb-1">4. Feedback</span>
          <div className="font-sans font-bold text-slate-900 mb-1">ToolMessage Injected</div>
          <code className="text-[11px] text-emerald-900 font-mono block bg-white p-1.5 rounded border border-emerald-100">
            ToolMessage(<br />
            &nbsp;&nbsp;content="Refunded $45"<br />
            )
          </code>
          <p className="mt-1.5 text-[11px] text-emerald-800 m-0">Brain receives observation.</p>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Note:</strong> The model never executes functions directly. It emits structured JSON arguments, and your application runs the code and feeds back the result.
      </p>
    </div>
  );
}

// 12. BRAIN - AGENTIC LOOP
export function BrainAgenticLoopDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          The Agentic Loop
        </span>
        <span className="font-mono text-xs text-blue-600">Model ↔ Tools Cycle</span>
      </div>

      <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center">
        <div className="w-full md:w-1/4 rounded-lg border border-line bg-paper p-3">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block mb-1">Start</span>
          <span className="font-sans text-xs font-bold text-slate-900 block">User Request</span>
          <span className="font-mono text-[11px] text-slate-500 block mt-1">HumanMessage added</span>
        </div>

        <ArrowRight size={18} weight="bold" className="rotate-90 md:rotate-0 text-blue-500 shrink-0" />

        <div className="w-full md:w-1/3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 relative">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Brain size={15} weight="bold" className="text-indigo-600" />
            <span className="font-sans text-xs font-bold text-indigo-950">agent (Model Node)</span>
          </div>
          <span className="font-mono text-[11px] text-indigo-800 block">Invokes model with history</span>
          <div className="mt-2 pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-900 font-mono">
            Has tool calls?
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
          <div className="text-[10px] font-mono text-amber-600 font-bold">YES</div>
          <ArrowsClockwise size={20} weight="bold" className="text-amber-500" />
          <div className="text-[10px] font-mono text-emerald-600 font-bold">NO</div>
        </div>

        <div className="w-full md:w-1/3 space-y-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-left">
            <span className="font-mono text-[10px] uppercase font-bold text-amber-700 block">tools (ToolNode)</span>
            <span className="text-[11px] text-slate-700 font-sans block mt-0.5">Runs tool and loops back to <strong>agent</strong></span>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-left">
            <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block">__end__ (Done)</span>
            <span className="text-[11px] text-slate-700 font-sans block mt-0.5">Returns final answer to user</span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 rounded-lg border border-line bg-slate-50/80 p-2.5 flex items-center justify-between text-xs text-slate-600">
        <span><strong>Safety check:</strong> Set a <code>recursion_limit</code> to prevent runaway loops if the model gets stuck.</span>
        <span className="text-[11px] font-mono text-slate-400">Step limit guard</span>
      </div>
    </div>
  );
}

// 13. BRAIN - REASONING
export function BrainReasoningDiagram() {
  const effortLevels = [
    {
      level: "Low",
      tokens: "~Hundreds of tokens",
      color: "border-sky-200 bg-sky-50/40 text-sky-800",
      badge: "bg-sky-100 text-sky-700",
      useCase: "Fast sanity check, parameter validation, low-latency tool lookups.",
    },
    {
      level: "Medium",
      tokens: "~1,000 – 2,000 tokens",
      color: "border-indigo-200 bg-indigo-50/40 text-indigo-800",
      badge: "bg-indigo-100 text-indigo-700",
      useCase: "Multi-rule evaluation, edge case handling, standard agent workflows.",
    },
    {
      level: "High",
      tokens: "~4,000 – 16,000+ tokens",
      color: "border-purple-200 bg-purple-50/40 text-purple-800",
      badge: "bg-purple-100 text-purple-700",
      useCase: "Deep hypothesis search, backtracking, contract compliance, multi-file code.",
    },
  ];

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          The Scratchpad & Reasoning Models
        </span>
        <span className="font-mono text-xs text-blue-600">Test-Time Compute</span>
      </div>

      {/* Core Principle: Why a scratchpad exists */}
      <div className="rounded-lg border border-line bg-paper p-3 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900 font-semibold block mb-1">How the Scratchpad Works:</strong>
        An LLM does 1 forward pass per token and has no internal "pause" button. The only way it can spend more compute on a hard decision is by <strong>generating intermediate words</strong>. Those generated words become working memory (a scratchpad) that the model's self-attention reads before choosing the next action.
      </div>

      {/* Contrast Example: Direct vs Reasoned */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-rose-200 bg-rose-50/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-xs font-bold text-rose-900">Without Scratchpad (Instant Action)</span>
            <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">Knee-Jerk</span>
          </div>
          <div className="bg-paper p-2.5 rounded border border-rose-200 font-mono text-[11px] text-slate-700 space-y-1.5">
            <div>User: "Cancel and refund subscription SUB-899."</div>
            <div className="text-rose-700 font-bold">Action: call cancel_sub(id="SUB-899")</div>
            <div className="text-slate-500 text-[10px] italic">→ Problem: User has enterprise contract with penalties. Model acted without space to evaluate terms.</div>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-xs font-bold text-emerald-900">With Scratchpad (Reasoning Tokens)</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Checked</span>
          </div>
          <div className="bg-paper p-2.5 rounded border border-emerald-200 font-mono text-[11px] text-slate-700 space-y-1">
            <div className="text-slate-500 text-[10px]">&lt;think&gt; tokens (Scratchpad):</div>
            <div className="text-emerald-800 bg-emerald-50/80 p-1.5 rounded">
              1. Check contract type for SUB-899<br />
              2. Contract is Enterprise Annual (needs human review)<br />
              3. Do NOT auto-cancel; forward to support team
            </div>
            <div className="text-blue-700 font-bold mt-1">Action: route_to_support()</div>
          </div>
        </div>
      </div>

      {/* The Effort Knob */}
      <div className="rounded-lg border border-line bg-slate-50/60 p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={14} weight="bold" className="text-blue-600" />
            <span className="font-sans text-xs font-bold text-slate-900">
              Reasoning Effort Knob: Dials the Scratchpad Token Budget
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">Low / Medium / High</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {effortLevels.map((lvl) => (
            <div key={lvl.level} className="rounded-lg border border-line bg-paper p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans font-bold text-slate-900">{lvl.level} Effort</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${lvl.badge}`}>{lvl.tokens}</span>
                </div>
                <p className="text-[11px] text-slate-600 m-0 leading-snug">{lvl.useCase}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Takeaway:</strong> Modern reasoning models (o1, o3, Claude thinking) are natively trained to use this scratchpad. Dialing effort to low/med/high sets how many tokens the model is allowed to spend thinking before acting.
      </p>
    </div>
  );
}

// 14. BRAIN - PLANNING
export function BrainPlanningDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Task Planning & Decomposition
        </span>
        <span className="font-mono text-xs text-blue-600">Multi-Step Tasks</span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb size={16} weight="bold" className="text-amber-500" />
            <span className="font-sans text-xs font-bold text-slate-900">1. High-Level Request</span>
          </div>
          <div className="font-mono text-xs bg-slate-50 p-2 rounded border border-line text-slate-800">
            "Reconcile monthly invoices for Acme Corp and flag discrepancies."
          </div>
          <p className="mt-2 text-[11px] text-slate-500 m-0">Too broad for a single step.</p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <ListChecks size={16} weight="bold" className="text-blue-600" />
            <span className="font-sans text-xs font-bold text-slate-900">2. Sub-tasks</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded flex items-center justify-between">
              <span>[Done] Fetch Acme invoices</span>
            </div>
            <div className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded flex items-center justify-between">
              <span>[In Progress] Match Stripe charges</span>
            </div>
            <div className="bg-slate-50 text-slate-500 border border-line px-2 py-1 rounded flex items-center justify-between">
              <span>[Pending] Generate summary</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <GitBranch size={16} weight="bold" className="text-indigo-600" />
            <span className="font-sans text-xs font-bold text-slate-900">3. Dynamic Re-planning</span>
          </div>
          <div className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-line">
            If payment API errors:
            <div className="text-indigo-700 mt-1 font-semibold">
              → Insert step: query_backup_db()
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 m-0">Adjusts the sequence when results differ.</p>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Note:</strong> Planning breaks larger requests into manageable steps and adjusts when unexpected results occur.
      </p>
    </div>
  );
}

// 16. BODY - HARNESS
export function BodyHarnessDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Agent Harness Architecture
        </span>
        <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          The Runtime Engine
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left: Raw LLM Core */}
        <div className="md:col-span-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Brain size={16} weight="bold" className="text-slate-600" />
              <span className="font-sans text-xs font-bold text-slate-800">Raw Model (Brain)</span>
            </div>
            <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
              Completely stateless token generator. Has no network access, no loop control, and cannot execute tools on its own.
            </p>
          </div>
          <div className="mt-3 p-2 rounded bg-white border border-line font-mono text-[10px] text-slate-600">
            input: messages[]<br />
            output: text | tool_call
          </div>
        </div>

        {/* Right: The Harness Wrapper */}
        <div className="md:col-span-8 rounded-lg border border-amber-300 bg-amber-50/40 p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-amber-200">
            <div className="flex items-center gap-1.5">
              <GearSix size={16} weight="bold" className="text-amber-700" />
              <span className="font-sans text-xs font-bold text-amber-900">Agent Harness (The Body)</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
              Drives the execution
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-white border border-amber-200/80">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <ArrowsClockwise size={13} className="text-amber-600" /> Loop Driver
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 m-0">Executes <code>while not done</code>, checks terminal conditions.</p>
            </div>

            <div className="p-2 rounded bg-white border border-amber-200/80">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <TerminalWindow size={13} className="text-amber-600" /> Tool Dispatcher
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 m-0">Validates args, calls APIs/sandbox, captures stdout/stderr.</p>
            </div>

            <div className="p-2 rounded bg-white border border-amber-200/80">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <ShieldCheck size={13} className="text-amber-600" /> Circuit Breakers
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 m-0">Enforces step limit (e.g. 25), timeout, and token spend caps.</p>
            </div>

            <div className="p-2 rounded bg-white border border-amber-200/80">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Database size={13} className="text-amber-600" /> State Manager
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 m-0">Appends tool outputs, compacts history, handles retry logic.</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Key takeaway:</strong> The model decides <em>what</em> to do, but the harness actually performs the actions, handles errors, and enforces system safety.
      </p>
    </div>
  );
}

// 17. BODY - MCP (Model Context Protocol)
export function BodyMcpDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Model Context Protocol Architecture
        </span>
        <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          Universal JSON-RPC Standard
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Left: Host Client */}
        <div className="md:col-span-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Plugs size={16} weight="bold" className="text-blue-700" />
            <span className="font-sans text-xs font-bold text-slate-900">MCP Client (Host)</span>
          </div>
          <p className="text-[11px] text-slate-600 m-0">
            Claude Desktop, Cursor, or custom harness. Discovers tools & resources dynamically.
          </p>
          <div className="mt-2.5 text-[10px] font-mono text-blue-800 bg-white p-1.5 rounded border border-blue-200">
            JSON-RPC 2.0 (stdio / SSE / HTTP)
          </div>
        </div>

        {/* Center: Connectors */}
        <div className="md:col-span-1 flex md:flex-col items-center justify-center gap-1 text-slate-400">
          <ArrowsLeftRight size={20} className="hidden md:block text-slate-400" />
          <ArrowRight size={18} className="md:hidden text-slate-400" />
        </div>

        {/* Right: Pluggable MCP Servers */}
        <div className="md:col-span-7 space-y-2">
          <div className="rounded-lg border border-line bg-paper p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">Database MCP Server</div>
                <div className="text-[10px] text-slate-500">Exposes <code>read_query</code>, <code>list_tables</code>, schema resources</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">PostgreSQL</span>
          </div>

          <div className="rounded-lg border border-line bg-paper p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalWindow size={16} className="text-violet-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">Developer Tools Server</div>
                <div className="text-[10px] text-slate-500">GitHub PRs, Git commits, Jira tickets, CI logs</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">GitHub API</span>
          </div>

          <div className="rounded-lg border border-line bg-paper p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cube size={16} className="text-indigo-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">Filesystem & Local Tools</div>
                <div className="text-[10px] text-slate-500">Read/write files, directory trees, local search</div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Local OS</span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-line grid grid-cols-3 gap-2 text-center text-[11px]">
        <div className="p-1.5 bg-slate-50 rounded border border-line">
          <strong className="text-slate-800 block">Tools</strong>
          <span className="text-slate-500 text-[10px]">Model-callable functions</span>
        </div>
        <div className="p-1.5 bg-slate-50 rounded border border-line">
          <strong className="text-slate-800 block">Resources</strong>
          <span className="text-slate-500 text-[10px]">File/data context streams</span>
        </div>
        <div className="p-1.5 bg-slate-50 rounded border border-line">
          <strong className="text-slate-800 block">Prompts</strong>
          <span className="text-slate-500 text-[10px]">Pre-composed templates</span>
        </div>
      </div>
    </div>
  );
}

// 18. BODY - COMPUTER USE
export function BodyComputerUseDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Visual Computer Use Closed-Loop
        </span>
        <span className="font-mono text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          Pixels In → Events Out
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2.5 text-center">
        {/* Step 1 */}
        <div className="rounded-lg border border-line bg-paper p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1.5 text-rose-600">
              <Camera size={18} weight="bold" />
              <span className="font-sans text-xs font-bold text-slate-800">1. Capture</span>
            </div>
            <p className="text-[11px] text-slate-500 m-0">
              Harness takes a screen snapshot and scales it to standard model resolution.
            </p>
          </div>
          <div className="mt-2.5 font-mono text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-line">
            screenshot.png (1024×768)
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-lg border border-line bg-paper p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1.5 text-indigo-600">
              <Eye size={18} weight="bold" />
              <span className="font-sans text-xs font-bold text-slate-800">2. Perceive</span>
            </div>
            <p className="text-[11px] text-slate-500 m-0">
              Vision-language model locates buttons, forms, and predicts pixel coordinates.
            </p>
          </div>
          <div className="mt-2.5 font-mono text-[10px] text-indigo-700 bg-indigo-50 p-1.5 rounded border border-indigo-200">
            target: (x: 420, y: 310)
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-lg border border-line bg-paper p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1.5 text-amber-600">
              <CursorClick size={18} weight="bold" />
              <span className="font-sans text-xs font-bold text-slate-800">3. Actuate</span>
            </div>
            <p className="text-[11px] text-slate-500 m-0">
              Harness issues OS-level mouse clicks, typing keystrokes, or scroll commands.
            </p>
          </div>
          <div className="mt-2.5 font-mono text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
            mouse_click(420, 310)
          </div>
        </div>

        {/* Step 4 */}
        <div className="rounded-lg border border-line bg-paper p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1.5 mb-1.5 text-emerald-600">
              <CheckCircle size={18} weight="bold" />
              <span className="font-sans text-xs font-bold text-slate-800">4. Verify</span>
            </div>
            <p className="text-[11px] text-slate-500 m-0">
              Next frame confirms if modal opened or download finished before moving on.
            </p>
          </div>
          <div className="mt-2.5 font-mono text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
            UI state changed: True
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 border-t border-line pt-2.5">
        <div>
          <strong className="text-slate-700 font-semibold">When to use:</strong> Any app lacking an API (legacy software, desktop GUIs, visual tests).
        </div>
        <div className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
          Tradeoff: High latency (~2-4s/step)
        </div>
      </div>
    </div>
  );
}

// 19. BODY - SANDBOX
export function BodySandboxDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Agent Sandbox Isolation
        </span>
        <span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Untrusted Code Isolation
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Host Machine */}
        <div className="md:col-span-5 rounded-lg border border-line bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lock size={16} weight="bold" className="text-slate-700" />
            <span className="font-sans text-xs font-bold text-slate-800">Host Environment (Protected)</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="p-2 rounded bg-white border border-line text-slate-600">
              <span className="font-semibold text-slate-800 block">Agent Process / Server</span>
              Holds secret API keys, credentials, user session data, and database connections.
            </div>
            <div className="p-2 rounded bg-white border border-line text-rose-700 font-mono text-[10px]">
              Host FS: /etc, ~/.ssh, /Users/
              <div className="text-slate-500 text-[9px] mt-0.5">Strictly shielded from direct agent access</div>
            </div>
          </div>
        </div>

        {/* Isolation Wall */}
        <div className="md:col-span-2 flex flex-col items-center justify-center py-2 text-center">
          <div className="w-px h-6 bg-slate-300 hidden md:block" />
          <div className="px-2 py-1 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-700 my-1">
            gRPC / MicroVM Barrier
          </div>
          <div className="w-px h-6 bg-slate-300 hidden md:block" />
        </div>

        {/* Guest Sandbox */}
        <div className="md:col-span-5 rounded-lg border border-emerald-300 bg-emerald-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldCheck size={16} weight="bold" className="text-emerald-700" />
            <span className="font-sans text-xs font-bold text-emerald-950">Disposable Sandbox (Guest)</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-1.5 rounded bg-white border border-emerald-200 text-slate-700">
              <span className="font-semibold text-emerald-800 text-[10px] block">Ephemeral Filesystem</span>
              Copy-on-write overlay; destroyed immediately when session ends.
            </div>
            <div className="p-1.5 rounded bg-white border border-emerald-200 text-slate-700">
              <span className="font-semibold text-emerald-800 text-[10px] block">Strict Egress Filtering</span>
              Zero network access or strict allowlist (no unauthorized data exfiltration).
            </div>
            <div className="p-1.5 rounded bg-white border border-emerald-200 text-slate-700">
              <span className="font-semibold text-emerald-800 text-[10px] block">Resource Cgroups</span>
              Capped CPU (1-2 cores), RAM (512MB-2GB), hard execution timeout (30s).
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Security principle:</strong> Never execute LLM-written code or arbitrary shell commands directly on your production host or development machine without containerization.
      </p>
    </div>
  );
}

// 20. MIND - CONTEXT WINDOW
export function MindContextWindowDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Context Window Budget
        </span>
        <span className="font-mono text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
          Everything Competes for Tokens
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {/* The Budget Bar */}
        <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">Total Available Window</span>
            <span className="font-mono text-xs text-violet-700 bg-white px-2 py-0.5 rounded border border-violet-200">
              128k tokens
            </span>
          </div>
          <div className="h-8 rounded-lg overflow-hidden border border-violet-300 bg-white flex">
            <div className="bg-blue-500 flex items-center justify-center text-white text-[10px] font-mono font-semibold" style={{width: '10%'}}>
              System<br/>12k
            </div>
            <div className="bg-emerald-500 flex items-center justify-center text-white text-[10px] font-mono font-semibold" style={{width: '50%'}}>
              Conversation History 64k
            </div>
            <div className="bg-amber-500 flex items-center justify-center text-white text-[10px] font-mono font-semibold" style={{width: '25%'}}>
              Tool Outputs 32k
            </div>
            <div className="bg-rose-500 flex items-center justify-center text-white text-[10px] font-mono font-semibold" style={{width: '15%'}}>
              User Query<br/>20k
            </div>
          </div>
        </div>

        {/* What Happens When You Overflow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs font-bold text-rose-900">⚠️ Overflow Consequence</span>
            </div>
            <p className="text-[11px] text-slate-600 m-0">
              When total tokens exceed 128k, the API silently <strong>truncates the oldest messages</strong> — often the system instruction defining core behavior.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs font-bold text-emerald-900">✓ Engineering Solution</span>
            </div>
            <p className="text-[11px] text-slate-600 m-0">
              Apply <strong>trim</strong> (drop old messages), <strong>compact</strong> (shrink tool dumps), and <strong>store</strong> stable facts outside the chat.
            </p>
          </div>
        </div>

        {/* Cost Reality */}
        <div className="rounded-lg border border-line bg-slate-50 p-2.5 text-center">
          <p className="text-[11px] text-slate-600 m-0">
            <span className="font-semibold text-slate-800">Cost scales with tokens:</span> A 100k-token prompt costs 10x more than a 10k-token prompt. Bigger windows do not eliminate the need for context engineering.
          </p>
        </div>
      </div>
    </div>
  );
}

// 21. MIND - CONTEXT ENGINEERING
export function MindContextEngineeringDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Five-Layer Context Strategy
        </span>
        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
          Applied in Order
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {/* Layer 1: Trim */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-2.5 flex items-start gap-2.5">
          <div className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            1
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-900 mb-0.5">Trim</div>
            <p className="text-[11px] text-slate-600 m-0">
              Keep only the last <code>N</code> messages or a fixed token budget. Drop distant history first.
            </p>
            <div className="mt-1.5 font-mono text-[10px] text-blue-800 bg-white px-2 py-1 rounded border border-blue-200 inline-block">
              trim_messages(max_tokens=8000)
            </div>
          </div>
        </div>

        {/* Layer 2: Compact */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5 flex items-start gap-2.5">
          <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
            2
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-900 mb-0.5">Compact</div>
            <p className="text-[11px] text-slate-600 m-0">
              Shrink verbose tool outputs (e.g. 5000-line JSON) to one-line summaries or error codes.
            </p>
            <div className="mt-1.5 font-mono text-[10px] text-emerald-800 bg-white px-2 py-1 rounded border border-emerald-200 inline-block">
              compact_tool_messages()
            </div>
          </div>
        </div>

        {/* Layer 3: Summarize */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-2.5 flex items-start gap-2.5">
          <div className="shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
            3
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-900 mb-0.5">Summarize</div>
            <p className="text-[11px] text-slate-600 m-0">
              Replace 20 old turns with a short paragraph recap. Keeps the gist without the verbatim transcript.
            </p>
            <div className="mt-1.5 font-mono text-[10px] text-amber-800 bg-white px-2 py-1 rounded border border-amber-200 inline-block">
              summarize_conversation()
            </div>
          </div>
        </div>

        {/* Layer 4: Store */}
        <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-2.5 flex items-start gap-2.5">
          <div className="shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
            4
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-900 mb-0.5">Store</div>
            <p className="text-[11px] text-slate-600 m-0">
              Move stable facts (preferences, account metadata) out of chat into the LangGraph Store.
            </p>
            <div className="mt-1.5 font-mono text-[10px] text-violet-800 bg-white px-2 py-1 rounded border border-violet-200 inline-block">
              store.put("customer:123", prefs)
            </div>
          </div>
        </div>

        {/* Layer 5: Retrieve */}
        <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-2.5 flex items-start gap-2.5">
          <div className="shrink-0 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
            5
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-900 mb-0.5">Retrieve</div>
            <p className="text-[11px] text-slate-600 m-0">
              Pull only relevant docs, past tickets, or memory items for this specific query (RAG).
            </p>
            <div className="mt-1.5 font-mono text-[10px] text-rose-800 bg-white px-2 py-1 rounded border border-rose-200 inline-block">
              vector_store.search(query)
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Discipline:</strong> Start at Layer 1 (trim) and move down the ladder only when simpler techniques fail. Most agents never need Layer 5.
      </p>
    </div>
  );
}

// 22. MIND - MEMORY
export function MindMemoryDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Three-Layer Memory Architecture
        </span>
        <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          Short / Session / Long
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {/* Layer 1: Short-Term (In-Context) */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Cpu size={16} weight="bold" className="text-blue-700" />
              <span className="font-sans text-xs font-bold text-slate-900">1. Short-Term (In-Context)</span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
              What the model sees NOW
            </span>
          </div>
          <p className="text-[11px] text-slate-600 m-0 mb-2">
            The filtered subset of messages visible to the model in this specific API call. After trim/compact, typically the last N messages that fit the context window.
          </p>
          <div className="font-mono text-[10px] text-blue-800 bg-white p-2 rounded border border-blue-200">
            # Last 15 of 50 total messages<br />
            messages = trim_messages(all_messages, max=15)
          </div>
        </div>

        {/* Layer 2: Session (Checkpointed) */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Database size={16} weight="bold" className="text-emerald-700" />
              <span className="font-sans text-xs font-bold text-slate-900">2. Session (Checkpointed Thread)</span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              Complete thread history
            </span>
          </div>
          <p className="text-[11px] text-slate-600 m-0 mb-2">
            The full durable conversation record for this thread_id, stored on disk (SQLite/Postgres). Contains ALL messages, persists across API calls and server restarts.
          </p>
          <div className="font-mono text-[10px] text-emerald-800 bg-white p-2 rounded border border-emerald-200">
            # All 50 messages persisted on disk<br />
            checkpointer.get_state(thread_id="TKT-42")
          </div>
        </div>

        {/* Layer 3: Long-Term (Store) */}
        <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Lock size={16} weight="bold" className="text-violet-700" />
              <span className="font-sans text-xs font-bold text-slate-900">3. Long-Term (Store)</span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-violet-800 bg-violet-100 px-1.5 py-0.5 rounded">
              Cross-thread facts
            </span>
          </div>
          <p className="text-[11px] text-slate-600 m-0 mb-2">
            Structured, namespaced facts that persist across threads and sessions. Customer preferences, account metadata, stable policies. Retrieved on-demand.
          </p>
          <div className="font-mono text-[10px] text-violet-800 bg-white p-2 rounded border border-violet-200">
            store.search(namespace="customer:123")
          </div>
        </div>

        {/* Comparison Table */}
        <div className="rounded-lg border border-line bg-slate-50 p-2.5">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-slate-700">
            <div className="p-1.5 bg-white rounded border border-line">
              <div className="text-blue-700 mb-0.5">Short-Term</div>
              Filtered subset (15 of 50)
            </div>
            <div className="p-1.5 bg-white rounded border border-line">
              <div className="text-emerald-700 mb-0.5">Session</div>
              Complete history (all 50)
            </div>
            <div className="p-1.5 bg-white rounded border border-line">
              <div className="text-violet-700 mb-0.5">Long-Term</div>
              Structured facts (prefs)
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Key distinction:</strong> In-context is what the model sees THIS call (subset). Checkpointer is the full durable thread. Store is cross-thread facts.
      </p>
    </div>
  );
}

// 23. TEAM - SUB-AGENT
export function TeamSubagentDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Sub-agent Task Delegation
        </span>
        <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Spawn → Execute → Return
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Parent Agent */}
        <div className="md:col-span-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Robot size={16} weight="bold" className="text-blue-700" />
            <span className="font-sans text-xs font-bold text-slate-900">Parent Agent</span>
          </div>
          <p className="text-[11px] text-slate-600 m-0 mb-2">
            Recognizes it cannot handle a subtask alone. Decides to delegate and spawns a specialized sub-agent.
          </p>
          <div className="mt-2 font-mono text-[10px] text-blue-800 bg-white p-2 rounded border border-blue-200">
            if needs_research:<br />
            &nbsp;&nbsp;spawn_subagent("research", context)
          </div>
        </div>

        {/* Arrow */}
        <div className="md:col-span-1 flex items-center justify-center">
          <ArrowRight size={24} className="text-slate-400" />
        </div>

        {/* Sub-agent */}
        <div className="md:col-span-3 rounded-lg border border-emerald-300 bg-emerald-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Cpu size={16} weight="bold" className="text-emerald-700" />
            <span className="font-sans text-xs font-bold text-slate-900">Sub-agent</span>
          </div>
          <p className="text-[11px] text-slate-600 m-0 mb-2">
            Isolated context, specialized system prompt. Executes the focused subtask independently.
          </p>
          <div className="mt-2 text-[10px] font-semibold text-emerald-800 bg-white p-1.5 rounded border border-emerald-200">
            ✓ Fresh context window<br />
            ✓ Task-specific tools<br />
            ✓ No parent history pollution
          </div>
        </div>

        {/* Arrow Back */}
        <div className="md:col-span-1 flex items-center justify-center">
          <ArrowRight size={24} className="text-slate-400 transform rotate-180" />
        </div>

        {/* Result */}
        <div className="md:col-span-3 rounded-lg border border-violet-200 bg-violet-50/50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle size={16} weight="bold" className="text-violet-700" />
            <span className="font-sans text-xs font-bold text-slate-900">Result Returned</span>
          </div>
          <p className="text-[11px] text-slate-600 m-0 mb-2">
            Sub-agent completes and returns structured output. Parent continues with the result.
          </p>
          <div className="mt-2 font-mono text-[10px] text-violet-800 bg-white p-2 rounded border border-violet-200">
            summary = "3 competitors found..."
          </div>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Why use sub-agents:</strong> Prevents context pollution, enables parallel execution, and allows specialized prompts for focused subtasks.
      </p>
    </div>
  );
}

// 24. TEAM - MULTI-AGENT
export function TeamMultiagentDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Multi-agent Collaboration Patterns
        </span>
        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
          Parallel + Sequential
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {/* Pattern 1: Parallel Execution */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-blue-200">
            <UsersThree size={16} weight="bold" className="text-blue-700" />
            <span className="font-sans text-xs font-bold text-slate-900">Pattern 1: Parallel Execution</span>
          </div>
          <p className="text-[11px] text-slate-600 m-0 mb-2">
            Multiple agents work independently on different subtasks simultaneously. Results are merged at the end.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-white border border-blue-200 text-[10px]">
              <div className="font-semibold text-blue-800 mb-1">Agent A</div>
              <div className="text-slate-600">Research pricing</div>
            </div>
            <div className="p-2 rounded bg-white border border-blue-200 text-[10px]">
              <div className="font-semibold text-blue-800 mb-1">Agent B</div>
              <div className="text-slate-600">Research competitors</div>
            </div>
            <div className="p-2 rounded bg-white border border-blue-200 text-[10px]">
              <div className="font-semibold text-blue-800 mb-1">Agent C</div>
              <div className="text-slate-600">Research features</div>
            </div>
          </div>
          <div className="mt-2 text-center text-[10px] text-slate-500">→ Merge results into final report</div>
        </div>

        {/* Pattern 2: Sequential Handoff */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-emerald-200">
            <ArrowRight size={16} weight="bold" className="text-emerald-700" />
            <span className="font-sans text-xs font-bold text-slate-900">Pattern 2: Sequential Handoff</span>
          </div>
          <p className="text-[11px] text-slate-600 m-0 mb-2">
            One agent completes its task, then explicitly hands control to the next specialist in the pipeline.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 rounded bg-white border border-emerald-200 text-[10px] text-center">
              <div className="font-semibold text-emerald-800">Triage Agent</div>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
            <div className="flex-1 p-2 rounded bg-white border border-emerald-200 text-[10px] text-center">
              <div className="font-semibold text-emerald-800">Research Agent</div>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
            <div className="flex-1 p-2 rounded bg-white border border-emerald-200 text-[10px] text-center">
              <div className="font-semibold text-emerald-800">Writer Agent</div>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
            <div className="flex-1 p-2 rounded bg-white border border-emerald-200 text-[10px] text-center">
              <div className="font-semibold text-emerald-800">Editor Agent</div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Key tradeoff:</strong> Parallel execution is faster but requires result merging. Sequential handoff is cleaner but adds latency for each step.
      </p>
    </div>
  );
}

// 25. TEAM - ORCHESTRATOR
export function TeamOrchestratorDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Orchestrator Decision Flow
        </span>
        <span className="font-mono text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          Meta-agent Control
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Task Input */}
        <div className="md:col-span-3 rounded-lg border border-line bg-slate-50 p-2.5 flex items-center justify-center text-center">
          <div>
            <div className="text-xs font-bold text-slate-800 mb-1">Incoming Task</div>
            <div className="text-[10px] text-slate-600">Customer ticket<br/>or user query</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="md:col-span-1 flex items-center justify-center">
          <ArrowRight size={20} className="text-slate-400" />
        </div>

        {/* Orchestrator */}
        <div className="md:col-span-4 rounded-lg border border-rose-300 bg-rose-50/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Brain size={16} weight="bold" className="text-rose-700" />
              <span className="font-sans text-xs font-bold text-slate-900">Orchestrator</span>
            </div>
            <span className="text-[9px] font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">Meta-agent</span>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
              <strong className="text-rose-800">1. Classify task type</strong>
            </div>
            <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
              <strong className="text-rose-800">2. Select specialist agent</strong>
            </div>
            <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
              <strong className="text-rose-800">3. Prepare input context</strong>
            </div>
            <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
              <strong className="text-rose-800">4. Route to specialist</strong>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="md:col-span-1 flex items-center justify-center">
          <ArrowRight size={20} className="text-slate-400" />
        </div>

        {/* Specialist Agents */}
        <div className="md:col-span-3 space-y-2">
          <div className="p-2 rounded bg-blue-50 border border-blue-200 text-[10px] text-center font-semibold text-blue-800">
            Tech Support Agent
          </div>
          <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-center font-semibold text-emerald-800">
            Billing Agent
          </div>
          <div className="p-2 rounded bg-violet-50 border border-violet-200 text-[10px] text-center font-semibold text-violet-800">
            Escalation Agent
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-line grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-slate-50 rounded border border-line text-center">
          <strong className="text-slate-800 block mb-0.5">LLM-based Supervisor</strong>
          <span className="text-slate-500 text-[10px]">Dynamic reasoning, flexible but adds latency</span>
        </div>
        <div className="p-2 bg-slate-50 rounded border border-line text-center">
          <strong className="text-slate-800 block mb-0.5">Rule-based Router</strong>
          <span className="text-slate-500 text-[10px]">Deterministic logic, fast but rigid</span>
        </div>
      </div>
    </div>
  );
}

// 26. TEAM - HANDOFF
export function TeamHandoffDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Durable State Handoff
        </span>
        <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          Context Transfer
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {/* Agent-to-Agent Handoff */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-blue-200">
            <ArrowsLeftRight size={16} weight="bold" className="text-blue-700" />
            <span className="font-sans text-xs font-bold text-slate-900">Agent-to-Agent Handoff</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded bg-white border border-blue-200">
              <div className="font-semibold text-blue-800 text-[10px] mb-1">1. Source Agent</div>
              <div className="text-slate-600 text-[10px]">Completes research task, prepares structured context snapshot</div>
            </div>
            <div className="p-2 rounded bg-white border border-blue-200">
              <div className="font-semibold text-blue-800 text-[10px] mb-1">2. State Transfer</div>
              <div className="text-slate-600 text-[10px]">Persists: inputs, outputs, decisions, reason for handoff</div>
            </div>
            <div className="p-2 rounded bg-white border border-blue-200">
              <div className="font-semibold text-blue-800 text-[10px] mb-1">3. Target Agent</div>
              <div className="text-slate-600 text-[10px]">Receives full context, continues from where source left off</div>
            </div>
          </div>
        </div>

        {/* Agent-to-Human Handoff */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-amber-200">
            <UsersThree size={16} weight="bold" className="text-amber-700" />
            <span className="font-sans text-xs font-bold text-slate-900">Agent-to-Human Handoff</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex items-start gap-2">
              <div className="shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">1</div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900 text-[10px]">Agent pauses execution</div>
                <div className="text-slate-600 text-[10px]">Triggers <code>interrupt()</code> when human judgment needed (e.g. refund approval)</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">2</div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900 text-[10px]">Human reviews context</div>
                <div className="text-slate-600 text-[10px]">Dashboard shows ticket summary, proposed action, and policy violation reason</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">3</div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900 text-[10px]">Agent resumes</div>
                <div className="text-slate-600 text-[10px]">After approval/rejection, state is reloaded and execution continues</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Critical requirement:</strong> Handoffs must preserve full context (inputs, outputs, decisions, and reason) so the receiver understands exactly what happened and why.
      </p>
    </div>
  );
}

// 27. SAFETY NET - GUARDRAILS
export function SafetyGuardrailsDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Guardrail Policy Enforcement
        </span>
        <span className="font-mono text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          Block Before Execute
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Agent Request */}
        <div className="md:col-span-3 rounded-lg border border-line bg-slate-50 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Robot size={16} weight="bold" className="text-slate-600" />
            <span className="text-xs font-bold text-slate-800">Agent</span>
          </div>
          <div className="font-mono text-[10px] text-slate-700 bg-white p-2 rounded border border-line mt-2">
            refund_order(<br />
            &nbsp;&nbsp;order='ORD-1',<br />
            &nbsp;&nbsp;amount=10000<br />
            )
          </div>
        </div>

        {/* Arrow */}
        <div className="md:col-span-1 flex items-center justify-center">
          <ArrowRight size={20} className="text-slate-400" />
        </div>

        {/* Guardrail Check */}
        <div className="md:col-span-4 rounded-lg border border-rose-300 bg-rose-50/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" className="text-rose-700" />
              <span className="font-sans text-xs font-bold text-slate-900">Guardrail Middleware</span>
            </div>
            <span className="text-[9px] font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">Pre-execution</span>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
              <strong className="text-rose-800">✓ Validate arguments</strong><br />
              <span className="text-[9px] text-slate-500">Check data types, ranges, formats</span>
            </div>
            <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
              <strong className="text-rose-800">✗ Check policy</strong><br />
              <span className="text-[9px] text-rose-600 font-semibold">$10,000 exceeds $5,000 limit!</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="md:col-span-1 flex items-center justify-center">
          <ArrowRight size={20} className="text-slate-400" />
        </div>

        {/* Blocked + Escalation */}
        <div className="md:col-span-3 rounded-lg border border-amber-300 bg-amber-50/50 p-2.5">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Lock size={16} weight="bold" className="text-amber-700" />
            <span className="text-xs font-bold text-amber-900">Blocked</span>
          </div>
          <div className="text-[10px] text-center text-slate-600 mb-2">
            Execution prevented.<br />Escalate to human approval.
          </div>
          <div className="text-center">
            <span className="inline-block text-[9px] font-mono text-amber-800 bg-white px-2 py-1 rounded border border-amber-300">
              → HITL workflow triggered
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-line grid grid-cols-3 gap-2 text-[11px]">
        <div className="p-2 bg-slate-50 rounded border border-line text-center">
          <strong className="text-slate-800 block mb-0.5">Input Validation</strong>
          <span className="text-slate-500 text-[10px]">Check args before execution</span>
        </div>
        <div className="p-2 bg-slate-50 rounded border border-line text-center">
          <strong className="text-slate-800 block mb-0.5">Policy Enforcement</strong>
          <span className="text-slate-500 text-[10px]">Block rule violations</span>
        </div>
        <div className="p-2 bg-slate-50 rounded border border-line text-center">
          <strong className="text-slate-800 block mb-0.5">Output Filtering</strong>
          <span className="text-slate-500 text-[10px]">Scrub PII, redact secrets</span>
        </div>
      </div>
    </div>
  );
}

// 28. SAFETY NET - HUMAN IN THE LOOP
export function SafetyHumanInLoopDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Human-in-the-Loop Approval Workflow
        </span>
        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
          Async Approval
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {/* Step 1: Agent Pause */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Robot size={14} weight="bold" className="text-blue-700" />
                <span className="font-sans text-xs font-bold text-slate-900">Agent Pause & Checkpoint</span>
              </div>
              <p className="text-[11px] text-slate-600 m-0 mb-2">
                Agent detects high-stakes decision (refund {'>'}$5k, low confidence, policy violation). Checkpoints state and triggers HITL.
              </p>
              <div className="font-mono text-[10px] text-blue-800 bg-white p-2 rounded border border-blue-200">
                interrupt(reason="Refund exceeds policy threshold")
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Human Review */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <UsersThree size={14} weight="bold" className="text-emerald-700" />
                <span className="font-sans text-xs font-bold text-slate-900">Human Review Dashboard</span>
              </div>
              <p className="text-[11px] text-slate-600 m-0 mb-2">
                Notification sent (email/Slack). Human views full context: ticket history, proposed action, reasoning, and policy violation details.
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="p-1.5 rounded bg-white border border-emerald-200 text-center font-semibold text-emerald-800">
                  Approve
                </div>
                <div className="p-1.5 rounded bg-white border border-emerald-200 text-center font-semibold text-slate-700">
                  Edit
                </div>
                <div className="p-1.5 rounded bg-white border border-emerald-200 text-center font-semibold text-rose-700">
                  Reject
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Agent Resume */}
        <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">3</div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle size={14} weight="bold" className="text-violet-700" />
                <span className="font-sans text-xs font-bold text-slate-900">Agent Resume Execution</span>
              </div>
              <p className="text-[11px] text-slate-600 m-0 mb-2">
                After approval (or edit/reject), state is reloaded from checkpoint. Agent continues with human decision incorporated.
              </p>
              <div className="font-mono text-[10px] text-violet-800 bg-white p-2 rounded border border-violet-200">
                resume(thread_id, approval="approved")
              </div>
            </div>
          </div>
        </div>

        {/* SLA & Escalation */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-2.5 text-center text-[11px]">
          <strong className="text-amber-900">SLA & Escalation:</strong>
          <span className="text-slate-600"> If no response in 30 minutes, auto-escalate to manager. If no response in 2 hours, auto-reject and notify customer.</span>
        </div>
      </div>
    </div>
  );
}

// 29. SAFETY NET - EVALS
export function SafetyEvalsDiagram() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-xs w-full">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
          Agent Evaluation Pipeline
        </span>
        <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          Continuous Testing
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {/* Eval Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Correctness */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle size={16} weight="bold" className="text-blue-700" />
              <span className="font-sans text-xs font-bold text-slate-900">Correctness</span>
            </div>
            <p className="text-[11px] text-slate-600 m-0 mb-2">
              Does the agent produce the right answer?
            </p>
            <div className="space-y-1 text-[10px]">
              <div className="p-1.5 rounded bg-white border border-blue-200 text-slate-700">
                ✓ Retrieves correct order
              </div>
              <div className="p-1.5 rounded bg-white border border-blue-200 text-slate-700">
                ✓ Calculates accurate refund
              </div>
              <div className="p-1.5 rounded bg-white border border-blue-200 text-slate-700">
                ✓ Follows policy rules
              </div>
            </div>
          </div>

          {/* Safety */}
          <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck size={16} weight="bold" className="text-rose-700" />
              <span className="font-sans text-xs font-bold text-slate-900">Safety</span>
            </div>
            <p className="text-[11px] text-slate-600 m-0 mb-2">
              Does the agent avoid dangerous actions?
            </p>
            <div className="space-y-1 text-[10px]">
              <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
                ✓ Never leaks PII
              </div>
              <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
                ✓ Never deletes data
              </div>
              <div className="p-1.5 rounded bg-white border border-rose-200 text-slate-700">
                ✓ Requires approval
              </div>
            </div>
          </div>

          {/* Quality */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ListChecks size={16} weight="bold" className="text-emerald-700" />
              <span className="font-sans text-xs font-bold text-slate-900">Quality</span>
            </div>
            <p className="text-[11px] text-slate-600 m-0 mb-2">
              Does the output meet standards?
            </p>
            <div className="space-y-1 text-[10px]">
              <div className="p-1.5 rounded bg-white border border-emerald-200 text-slate-700">
                ✓ Polite tone
              </div>
              <div className="p-1.5 rounded bg-white border border-emerald-200 text-slate-700">
                ✓ No hallucinations
              </div>
              <div className="p-1.5 rounded bg-white border border-emerald-200 text-slate-700">
                ✓ Coherent reasoning
              </div>
            </div>
          </div>
        </div>

        {/* Eval Pipeline Flow */}
        <div className="rounded-lg border border-line bg-slate-50 p-3">
          <div className="text-xs font-bold text-slate-800 mb-2 text-center">Continuous Eval Pipeline (CI/CD)</div>
          <div className="flex items-center gap-2 justify-center">
            <div className="px-3 py-2 rounded bg-white border border-line text-[10px] font-semibold text-slate-800 text-center">
              Code/Prompt<br />Change
            </div>
            <ArrowRight size={16} className="text-slate-400" />
            <div className="px-3 py-2 rounded bg-blue-50 border border-blue-200 text-[10px] font-semibold text-blue-800 text-center">
              Run 100<br />Test Cases
            </div>
            <ArrowRight size={16} className="text-slate-400" />
            <div className="px-3 py-2 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800 text-center">
              Compute<br />Metrics
            </div>
            <ArrowRight size={16} className="text-slate-400" />
            <div className="px-3 py-2 rounded bg-violet-50 border border-violet-200 text-[10px] font-semibold text-violet-800 text-center">
              Regression<br />Detection
            </div>
          </div>
        </div>

        {/* Metrics Example */}
        <div className="rounded-lg border border-line bg-white p-2.5">
          <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
            <div>
              <div className="font-semibold text-blue-700">Accuracy</div>
              <div className="text-lg font-bold text-slate-800">94%</div>
            </div>
            <div>
              <div className="font-semibold text-emerald-700">Safety Pass</div>
              <div className="text-lg font-bold text-slate-800">100%</div>
            </div>
            <div>
              <div className="font-semibold text-violet-700">Avg Latency</div>
              <div className="text-lg font-bold text-slate-800">2.1s</div>
            </div>
            <div>
              <div className="font-semibold text-amber-700">Avg Cost</div>
              <div className="text-lg font-bold text-slate-800">$0.08</div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3.5 mb-0 text-xs text-slate-500">
        <strong className="text-slate-700 font-semibold">Best practice:</strong> Run evals on every code/prompt change. Track metrics over time. Flag regressions before production deployment.
      </p>
    </div>
  );
}

// Map slide IDs to custom diagrams
export const SLIDE_DIAGRAMS = {
  llm: LlmDiagram,
  prompt: PromptDiagram,
  token: TokenDiagram,
  "context-window": ContextWindowDiagram,
  "top-k": TopKDiagram,
  "top-p": TopPDiagram,
  "sampling-combo": SamplingComboDiagram,
  hallucination: HallucinationDiagram,
  "agent-architecture": AgentPartsDiagram,
  "systems-roadmap": AgentPartsDiagram,
  "brain-ai-agent": BrainAgentDiagram,
  "brain-tool-calling": BrainToolCallingDiagram,
  "brain-agentic-loop": BrainAgenticLoopDiagram,
  "brain-reasoning": BrainReasoningDiagram,
  "brain-planning": BrainPlanningDiagram,
  "body-harness": BodyHarnessDiagram,
  "body-mcp": BodyMcpDiagram,
  "body-computer-use": BodyComputerUseDiagram,
  "body-sandbox": BodySandboxDiagram,
  "mind-context-window": MindContextWindowDiagram,
  "mind-context-engineering": MindContextEngineeringDiagram,
  "mind-memory": MindMemoryDiagram,
  "team-subagent": TeamSubagentDiagram,
  "team-multiagent": TeamMultiagentDiagram,
  "team-orchestrator": TeamOrchestratorDiagram,
  "team-handoff": TeamHandoffDiagram,
  "safety-guardrails": SafetyGuardrailsDiagram,
  "safety-human-in-loop": SafetyHumanInLoopDiagram,
  "safety-evals": SafetyEvalsDiagram,
};
