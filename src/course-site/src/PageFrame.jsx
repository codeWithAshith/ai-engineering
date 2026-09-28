export function PageFrame({ title, lede, actions, prev, next, children }) {
  return (
    <article className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line pb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="m-0 font-sans text-[1.65rem] leading-tight font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {actions}
        </div>
        {lede ? (
          <p className="mt-2 mb-0 max-w-3xl font-serif text-base leading-relaxed text-slate-600">{lede}</p>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto py-6">{children}</div>
      <Pager prev={prev} next={next} />
    </article>
  );
}

export function Pager({ prev, next }) {
  return (
    <nav className="flex shrink-0 justify-between gap-6 border-t border-line pt-4" aria-label="Lesson">
      {prev ? (
        <a href={prev.href} className="min-w-0 no-underline">
          <span className="block text-[13px] font-medium text-muted">Back</span>
          <span className="mt-1 block truncate font-sans text-[15px] font-semibold text-ink">{prev.title}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a href={next.href} className="min-w-0 text-right no-underline">
          <span className="block text-[13px] font-medium text-accent">Next</span>
          <span className="mt-1 block truncate font-sans text-[15px] font-semibold text-accent">{next.title}</span>
        </a>
      ) : null}
    </nav>
  );
}

export function linkFor(item, hrefFor) {
  if (!item) return null;
  return { href: hrefFor(item), title: item.title };
}
