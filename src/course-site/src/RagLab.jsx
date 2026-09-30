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
        <button type="button" onClick={() => { setStep(0); setPlaying(true); }} className="cursor-pointer rounded-lg border border-teal-400 bg-teal-400 px-3 py-1.5 font-sans text-xs font-semibold text-slate-950">Play</button>
        <button type="button" onClick={() => { setPlaying(false); setStep((c) => Math.max(0, c < 0 ? 0 : c - 1)); }} className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200">Step back</button>
        <button type="button" onClick={() => { setPlaying(false); setStep((c) => Math.min(walkLength - 1, c < 0 ? 0 : c + 1)); }} className="cursor-pointer rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 font-sans text-xs font-semibold text-slate-200">Step</button>
        <span className="font-mono text-[11px] text-slate-500">{step < 0 ? "press Play" : `${step + 1} / ${walkLength}`}</span>
      </div>
      <p className="m-0 mt-3 rounded-xl border border-teal-900/40 bg-teal-950/30 px-3.5 py-2.5 font-serif text-sm text-teal-100">{note}</p>
    </div>
  );
}

function Rows({ rows, hot }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => {
        const on = hot?.includes(row.id);
        return (
          <div key={row.id} className={`rounded-lg border px-3 py-2 ${on ? "border-teal-400 bg-teal-400/15" : "border-slate-800 bg-slate-950"}`}>
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
    kicker: "01 · Why RAG",
    caption: "ORDERS can answer a status. A refund window lives in a policy file.",
    cases: [{
      name: "status vs policy",
      steps: [
        { note: "Status of ORD-1 is a lookup. The policy file is not in that table.", hot: ["orders"], rows: [
          { id: "orders", label: "ORDERS", value: "ORD-1 → shipped" },
          { id: "file", label: "Policy file", value: "refund_policy.txt · 45 days of delivery" },
        ]},
        { note: "Do not train the window in, and do not paste the whole file. Retrieve the passage at question time.", hot: ["file"], rows: [
          { id: "train", label: "Not this", value: "another training run" },
          { id: "paste", label: "Not this", value: "the whole policy in the prompt" },
          { id: "file", label: "This", value: "the refund passage, at question time" },
        ]},
      ],
    }],
  },
  index: {
    kicker: "02 · Index",
    caption: "Load, chunk, embed, store. Same embedding model as the question later.",
    cases: [{
      name: "three txt files",
      steps: [
        { note: "Each .txt becomes a Document. metadata.source is the file name.", hot: ["docs"], rows: [
          { id: "docs", label: "data/*.txt", value: "contacts.txt, refund_policy.txt, shipping_policy.txt" },
        ]},
        { note: "RecursiveCharacterTextSplitter uses chunk_size 160 and chunk_overlap 40.", hot: ["chunks"], rows: [
          { id: "chunks", label: "Chunks", value: "page_content plus source" },
          { id: "size", label: "Splitter", value: "160 / overlap 40" },
        ]},
        { note: "OllamaEmbeddings model nomic-embed-text. The file prints dims of embed_query(\"refund window\") and stops. It does not answer.", hot: ["store"], rows: [
          { id: "store", label: "InMemoryVectorStore", value: "indexed · nomic-embed-text" },
          { id: "stop", label: "Stops here", value: "no customer reply yet" },
        ]},
      ],
    }],
  },
  query: {
    kicker: "03 · Query",
    caption: "similarity_search compares vectors on the store. as_retriever() is that search as a runnable.",
    cases: [
      { name: "similarity_search", steps: [
        { note: "The question is embedded with the same model as the chunks. The store compares that vector to the stored vectors.", hot: ["q"], rows: [
          { id: "q", label: "Question", value: "What is the refund window?" },
          { id: "k", label: "k", value: "2 nearest chunks" },
        ]},
        { note: "similarity_search is a method on the store. It returns documents, not a customer reply.", hot: ["hit"], rows: [
          { id: "hit", label: "Nearest", value: "refund_policy.txt · 45 days of delivery" },
        ]},
      ]},
      { name: "as_retriever", steps: [
        { note: "as_retriever wraps the same search. search_kwargs k=2 is the same k. invoke(question) returns documents.", hot: ["r"], rows: [
          { id: "r", label: "retriever.invoke", value: "How long is standard shipping for ORD orders?" },
        ]},
        { note: "A chain can call the retriever without holding the store. The hit is still a passage.", hot: ["hit"], rows: [
          { id: "hit", label: "Nearest", value: "shipping_policy.txt · 3–5 business days after shipped" },
        ]},
      ]},
    ],
  },
  grounded: {
    kicker: "04 · Grounded answers",
    caption: "Retriever, then context, then prompt, then model. Answer only from the policy text.",
    cases: [{
      name: "refund window",
      steps: [
        { note: "Same two lines as citations: hits = retriever.invoke(question), then join page_content with a blank line.", hot: ["hits"], rows: [
          { id: "hits", label: "hits", value: "retriever.invoke(question) · k=3" },
          { id: "ctx", label: "context", value: "page_content joined with a blank line" },
        ]},
        { note: "System: Acme order support. Use ONLY this policy context. If missing, say you don't know.", hot: ["prompt"], rows: [
          { id: "prompt", label: "Prompt", value: "{context} and {question}" },
          { id: "model", label: "Model", value: "groq:openai/gpt-oss-20b" },
        ]},
        { note: "The chain prints the reply. Sources are not listed yet.", hot: ["ans"], rows: [
          { id: "ans", label: "Reply", value: "from the policy text, or “don't know”" },
          { id: "gap", label: "Still missing", value: "a source list" },
        ]},
      ],
    }],
  },
  citations: {
    kicker: "05 · Citations",
    caption: "The reply plus the file names on the retrieved chunks.",
    cases: [{
      name: "ORD tickets",
      steps: [
        { note: "Same two lines as grounded answers. sources is the sorted file names on hits.", hot: ["q"], rows: [
          { id: "q", label: "Question", value: "Who do I email about ORD tickets?" },
          { id: "hit", label: "Chunk", value: "contacts.txt · help@acme.example" },
        ]},
        { note: "sources is the sorted set of metadata.source. The fundamentals stop at answer plus that list.", hot: ["src"], rows: [
          { id: "ans", label: "answer", value: "from the context only" },
          { id: "src", label: "sources", value: "sorted file names, including contacts.txt" },
        ]},
      ],
    }],
  },
  lcel: {
    kicker: "RAG LangChain",
    caption: "Ingestion builds the store once. Query uses it, or returns the fallback.",
    cases: [
      { name: "ingest", steps: [
        { note: "ingest reads the fundamentals folder once. Chunks are 140 with overlap 30.", hot: ["store"], rows: [
          { id: "store", label: "store", value: "docs → chunks · nomic-embed-text" },
        ]},
      ]},
      { name: "refund window", steps: [
        { note: "query finds a policy hint and returns the file names plus the context.", hot: ["hit"], rows: [
          { id: "hit", label: "query", value: "sources: refund_policy.txt" },
        ]},
      ]},
      { name: "off topic", steps: [
        { note: "“quantum widget warranty on Mars” matches no hint. query returns the fallback.", hot: ["no"], rows: [
          { id: "no", label: "query", value: "I don't have policy context for that. Email help@acme.example." },
        ]},
      ]},
    ],
  },
  graph: {
    kicker: "06 · Graph",
    caption: "Same retrieve and generate. New part: they are nodes you can see.",
    cases: [{
      name: "email",
      steps: [
        { note: "State is question, context, and answer. retrieve fills context from k=3.", hot: ["ret"], rows: [
          { id: "q", label: "question", value: "Who do I email for ORD tickets?" },
          { id: "ret", label: "retrieve", value: "contacts.txt · help@acme.example" },
        ]},
        { note: "generate fills the prompt and writes answer. The graph always retrieves.", hot: ["gen"], rows: [
          { id: "gen", label: "generate", value: "answer from {context}" },
          { id: "end", label: "END", value: "no tool choice yet" },
        ]},
      ],
    }],
  },
  tool: {
    kicker: "07 · Policy as a tool",
    caption: "lookup_order for status. search_policies for the refund window.",
    cases: [
      { name: "ORD-1", steps: [
        { note: "Status of ORD-1? The agent calls lookup_order. ORDERS says shipped.", hot: ["look"], rows: [
          { id: "look", label: "lookup_order", value: "ORD-1 → shipped" },
          { id: "pol", label: "search_policies", value: "not this question" },
        ]},
      ]},
      { name: "refund window", steps: [
        { note: "What is the refund window? The agent calls search_policies. k=2, with the file name on each hit.", hot: ["pol"], rows: [
          { id: "look", label: "lookup_order", value: "not this question" },
          { id: "pol", label: "search_policies", value: "[refund_policy.txt] 45 days of delivery" },
        ]},
      ]},
    ],
  },
  complete: {
    kicker: "08 · One agent",
    caption: "ORDERS, policy search, and a Store. Thread support-complete-demo.",
    cases: [{
      name: "four turns",
      steps: [
        { note: "What is the status of ORD-1? lookup_order.", hot: ["look"], rows: [
          { id: "look", label: "lookup_order", value: "ORD-1 shipped" },
        ]},
        { note: "What is the refund window? search_policies.", hot: ["pol"], rows: [
          { id: "pol", label: "search_policies", value: "refund_policy.txt · 45 days" },
        ]},
        { note: "Save preference contact=email. save_pref writes the Store under customers / cust-42.", hot: ["store"], rows: [
          { id: "store", label: "Store", value: "contact = email" },
        ]},
        { note: "The last turn asks for the preference, ORD-2, and the refund days. Summary trigger is 10 messages, keep 4. Old tool dumps clear at 2500 tokens.", hot: ["all"], rows: [
          { id: "all", label: "Last turn", value: "get_prefs · ORD-2 pending · refund days" },
          { id: "mid", label: "Middleware", value: "trigger 10 / keep 4 · clear tool uses, keep 3" },
        ]},
      ],
    }],
  },
  eval: {
    kicker: "Eval",
    caption: "One RAG path. evaluate checks the file. judge scores the reply.",
    cases: [
      { name: "two questions", steps: [
        { note: "Same examples as the other files. The refund window gets an answer. Mars gets the fallback.", hot: ["yes"], rows: [
          { id: "yes", label: "example 1", value: "What is the refund window?" },
          { id: "no", label: "example 2", value: "quantum widget warranty on Mars" },
        ]},
      ]},
      { name: "evaluate", steps: [
        { note: "Five cases. A case is yes when the expected file name is in the query text.", hot: ["score"], rows: [
          { id: "score", label: "evaluate", value: "yes or no · then a score" },
          { id: "cancel", label: "cancel", value: "no policy hint · no" },
        ]},
      ]},
      { name: "judge", steps: [
        { note: "judge rates grounding, accuracy, and completeness from 1 to 5 and returns JSON.", hot: ["judge"], rows: [
          { id: "judge", label: "judge", value: "JSON scores 1–5 · a flag, not a proof" },
        ]},
      ]},
    ],
  },
};

export function RagLab({ id }) {
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
