export function Rich({ text }) {
  if (!text) return null;
  const bits = [];
  const re = /(`[^`]+`|\*\*[^*]+?\*\*)/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) bits.push(text.slice(last, m.index));
    const raw = m[0];
    if (raw.startsWith("`")) {
      bits.push(
        <code key={k++} className="rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[0.88em] font-medium text-slate-800">
          {raw.slice(1, -1)}
        </code>,
      );
    } else {
      bits.push(
        <strong key={k++} className="font-semibold text-slate-900">
          {raw.slice(2, -2)}
        </strong>,
      );
    }
    last = m.index + raw.length;
  }
  if (last < text.length) bits.push(text.slice(last));
  return bits;
}

export function Blocks({ blocks }) {
  if (!blocks?.length) return null;
  return (
    <div className="font-serif text-[1.06rem] leading-[1.75] text-slate-800">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <div key={i} className="mt-10 mb-3 flex items-center gap-3 border-b border-line pb-2.5 first:mt-2">
              <span className="h-4 w-1 rounded-full bg-blue-600" />
              <h2 className="m-0 font-sans text-[1.28rem] font-bold tracking-tight text-slate-900">
                <Rich text={block.text} />
              </h2>
            </div>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={i} className="mt-7 mb-2 font-sans text-[1.08rem] font-semibold tracking-tight text-slate-900 first:mt-1">
              <Rich text={block.text} />
            </h3>
          );
        }
        if (block.type === "p") {
          return (
            <p key={i} className="mt-0 mb-4 text-slate-700">
              <Rich text={block.text} />
            </p>
          );
        }
        if (block.type === "pre") {
          return (
            <pre key={i} className="mb-5 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900 p-4 font-mono text-[0.88rem] leading-relaxed text-slate-100 shadow-sm">
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="mb-5 list-none space-y-2.5 pl-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span className="leading-relaxed text-slate-700">
                    <Rich text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={i} className="mb-5 list-none space-y-2.5 pl-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 font-mono text-xs font-bold text-blue-600 ring-1 ring-blue-500/20">
                    {j + 1}
                  </span>
                  <span className="leading-relaxed text-slate-700">
                    <Rich text={item} />
                  </span>
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "table") {
          return (
            <div key={i} className="my-6 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
              <table className="w-full border-collapse text-left text-[0.98rem]">
                <thead className="bg-paper border-b border-line">
                  <tr>
                    {block.headers.map((cell, j) => (
                      <th key={j} className="py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider text-slate-500">
                        <Rich text={cell} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {block.rows.map((row, r) => (
                    <tr key={r} className="transition-colors hover:bg-slate-50/60">
                      {row.map((cell, j) => (
                        <td key={j} className="py-3.5 px-4 align-top text-slate-700">
                          <Rich text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
