"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImprovementTracker = ImprovementTracker;
function formatScoreChange(value) {
    if (value === null || value === 0) {
        return "No change";
    }
    return `${value > 0 ? "+" : ""}${value}`;
}
function scoreTone(value) {
    if (value === null || value === 0) {
        return "text-slate-900 dark:text-slate-100";
    }
    return value > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300";
}
function ImprovementTracker({ completedActions, scoreChange, remainingPriorityFixes, }) {
    const hasTrackedActivity = completedActions > 0 || scoreChange !== null;
    return (<section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_24px_60px_-34px_rgba(2,6,23,0.8)] sm:p-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Track your improvements
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
          Track your improvements
        </h2>
      </div>

      {!hasTrackedActivity ? (<div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <p className="font-semibold text-slate-950 dark:text-slate-100">
            Run your first optimisation to start tracking progress.
          </p>
          <p className="mt-2">
            Complete actions to see score movement and remaining priority fixes update in real time.
          </p>
        </div>) : (<div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] bg-slate-100 px-5 py-5 dark:bg-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Completed actions
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{completedActions}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-100 px-5 py-5 dark:bg-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Score change
          </p>
          <p className={`mt-3 text-4xl font-semibold tracking-tight ${scoreTone(scoreChange)}`}>
            {formatScoreChange(scoreChange)}
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-100 px-5 py-5 dark:bg-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Remaining priority fixes
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {remainingPriorityFixes}
          </p>
        </div>
      </div>)}
    </section>);
}
