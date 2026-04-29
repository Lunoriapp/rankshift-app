"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreCards = ScoreCards;
function ScoreCards({ items }) {
    return (<section className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
          Step 5 of 7: Score Interpretation
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
          Why this page is scoring the way it is
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-200">
          These categories explain the score quickly. Each one shows where optimisation is strong and where missing signals are still limiting visibility.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (<div key={item.key} className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_22px_45px_-38px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
          <div className="space-y-3">
            <p className="text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{item.key}</p>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${item.value.score === item.value.maxScore
                ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
                : "border-amber-200/80 bg-amber-50 text-amber-800"}`}>
              <span className={`h-2 w-2 rounded-full ${item.value.score === item.value.maxScore
                ? "bg-emerald-500"
                : "bg-amber-500"}`}/>
              {item.value.score === item.value.maxScore ? "Healthy" : "Needs work"}
            </span>
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {item.value.score}
            <span className="text-lg text-slate-400 dark:text-slate-500">/{item.value.maxScore}</span>
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#334155_75%,#64748b_100%)]" style={{ width: `${Math.round((item.value.score / item.value.maxScore) * 100)}%` }}/>
          </div>
          <p className="mt-4 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
            {item.reason}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-200">{item.impact}</p>
        </div>))}
      </div>
    </section>);
}
