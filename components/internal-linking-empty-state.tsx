interface InternalLinkingEmptyStateProps {
  hasActiveFilters: boolean;
}

export function InternalLinkingEmptyState({
  hasActiveFilters,
}: InternalLinkingEmptyStateProps) {
  if (hasActiveFilters) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-300">
          No matches
        </p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
          No opportunities match the current filters
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-200">
          The engine did return internal linking suggestions, but none fit the confidence or
          page filters you have applied. Clear a filter to review the broader action queue.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[30px] border border-emerald-200/70 bg-[linear-gradient(180deg,rgba(240,253,250,0.98),rgba(255,255,255,0.98))] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-colors duration-300 dark:border-emerald-900/70 dark:bg-[linear-gradient(180deg,rgba(6,78,59,0.32),rgba(15,23,42,0.98))] sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/80 dark:text-emerald-300">
        No live queue items
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        No strong matches found
      </h3>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-300">
        Suggested links below are generated based on page topic.
      </p>
    </div>
  );
}
