import { useState } from "react";

const ROLES = {
  system: { label: "SystemMessage", chip: "bg-slate-200 text-slate-800" },
  human: { label: "HumanMessage", chip: "bg-blue-100 text-blue-900" },
  ai: { label: "AIMessage", chip: "bg-emerald-100 text-emerald-900" },
};

export function MessagesDemo() {
  const [keepHistory, setKeepHistory] = useState(true);

  const messages = [
    { role: "system", text: "You are a geography tutor. Answer in one short sentence." },
    keepHistory
      ? { role: "human", text: "What is the capital of Germany?" }
      : null,
    keepHistory ? { role: "ai", text: "The capital of Germany is Berlin." } : null,
    { role: "human", text: "What about France?" },
  ].filter(Boolean);

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">The list</p>
      <p className="mt-1 mb-4 font-serif text-lg text-slate-200">
        The model only sees the messages you send on this call.
      </p>
      <div className="space-y-2 rounded-xl border border-dashed border-slate-600 bg-white p-4">
        {messages.map((message) => {
          const role = ROLES[message.role];
          const followUp = message.text.startsWith("What about");
          return (
            <div key={message.text} className="flex items-start gap-2">
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${role.chip}`}>
                {role.label}
              </span>
              <p className={`m-0 font-serif text-base text-slate-900 ${followUp ? "rounded-md bg-emerald-200 px-1.5 font-semibold text-emerald-950" : ""}`}>
                {message.text}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKeepHistory(true)}
          className={`cursor-pointer rounded-lg px-3 py-2 text-left text-sm ${keepHistory ? "bg-teal-400 font-bold text-slate-950" : "bg-slate-800 text-slate-300"}`}
        >
          Keep the Germany turn
          <span className="mt-0.5 block font-normal text-xs opacity-80">“What about France?” means the capital.</span>
        </button>
        <button
          type="button"
          onClick={() => setKeepHistory(false)}
          className={`cursor-pointer rounded-lg px-3 py-2 text-left text-sm ${!keepHistory ? "bg-teal-400 font-bold text-slate-950" : "bg-slate-800 text-slate-300"}`}
        >
          Drop the Germany turn
          <span className="mt-0.5 block font-normal text-xs opacity-80">“What about France?” has nothing to follow.</span>
        </button>
      </div>
    </div>
  );
}
