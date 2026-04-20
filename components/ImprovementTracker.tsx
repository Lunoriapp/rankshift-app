interface ImprovementTrackerProps {
  completedActions: number;
  scoreChange: number | null;
  remainingPriorityFixes: number;
}

function formatScoreChange(value: number | null): string {
  if (value === null || value === 0) {
    return "No change";
  }

  return `${value > 0 ? "+" : ""}${value}`;
}

function scoreTone(value: number | null): string {
  if (value === null || value === 0) {
    return "text-slate-100";
  }

  return value > 0 ? "text-emerald-300" : "text-red-300";
}

export function ImprovementTracker({
  completedActions,
  scoreChange,
  remainingPriorityFixes,
}: ImprovementTrackerProps) {
  return (
    <section className="rounded-[1.9rem] border border-slate-800 bg-slate-900 p-6 shadow-[0_24px_60px_-34px_rgba(2,6,23,0.8)] sm:p-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Track your improvements
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
          Track your improvements
        </h2>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] bg-slate-800 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Completed actions
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-white">{completedActions}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-800 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Score change
          </p>
          <p className={`mt-3 text-4xl font-semibold tracking-tight ${scoreTone(scoreChange)}`}>
            {formatScoreChange(scoreChange)}
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-800 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Remaining priority fixes
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {remainingPriorityFixes}
          </p>
        </div>
      </div>
    </section>
  );
}
