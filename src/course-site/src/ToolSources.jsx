import { useState } from "react";

const SOURCES = [
  {
    id: "builtin",
    label: "Built-in",
    blurb: "You import the function. Read the description before you hand it over.",
    how: "from langchain_community.tools import WikipediaQueryRun",
    tools: [
      { name: "WikipediaQueryRun", description: "People, places, and historical facts.", args: "query: str" },
      { name: "DuckDuckGoSearchRun", description: "A current public page.", args: "query: str" },
      { name: "PythonREPLTool", description: "A Python snippet for a calculation.", args: "query: str" },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    blurb: "@tool on a function you write. A Pydantic Field only describes an argument.",
    how: '@tool\ndef lookup_order(order_id: str) -> str:\n    """Look up one order by id."""',
    tools: [
      { name: "lookup_order", description: "Where is my order? Not a refund.", args: "order_id: str" },
      { name: "issue_refund", description: "Refund after the customer asked.", args: "order_id: str, amount: float" },
    ],
  },
  {
    id: "toolkit",
    label: "Toolkit",
    blurb: "get_tools() returns several tools. The model sees each one, not the bundle.",
    how: "SQLDatabaseToolkit(db=db, llm=model).get_tools()",
    tools: [
      { name: "SQLDatabaseToolkit", description: "List, schema, check, then run.", args: "four tools" },
      { name: "FileManagementToolkit", description: "Read and write one folder.", args: "file tools" },
      { name: "JsonToolkit", description: "Read and write one JSON document.", args: "json tools" },
    ],
  },
];

export function ToolSources() {
  const [id, setId] = useState("builtin");
  const source = SOURCES.find((item) => item.id === id);

  return (
    <div className="mb-6 rounded-2xl border border-line bg-slate-950 p-4 text-white shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="m-0 font-sans text-xs font-bold uppercase tracking-wider text-teal-300">Where the tool comes from</p>
          <div className="mt-3 flex flex-col gap-2">
            {SOURCES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setId(item.id)}
                className={`rounded-xl border px-3 py-2 text-left font-sans text-sm font-semibold ${
                  item.id === id ? "border-teal-300 bg-teal-400 text-slate-950" : "border-slate-700 bg-slate-900 text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="m-0 font-serif text-sm leading-relaxed text-slate-200">{source.blurb}</p>
          <pre className="mt-3 mb-0 overflow-x-auto rounded-xl border border-dashed border-slate-600 bg-white p-3 font-mono text-xs leading-relaxed whitespace-pre text-slate-900">
            {source.how}
          </pre>
          <ul className="m-0 mt-3 list-none space-y-2 pl-0">
            {source.tools.map((tool) => (
              <li key={tool.name} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
                <p className="m-0 font-mono text-sm text-teal-200">{tool.name}</p>
                <p className="m-0 mt-1 font-serif text-sm text-slate-200">{tool.description}</p>
                <p className="m-0 mt-1 font-mono text-xs text-amber-200">{tool.args}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
