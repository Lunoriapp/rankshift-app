"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionPanel = ActionPanel;
function ActionPanel({ isPlanOpen, isComparisonOpen, onTogglePlan, onToggleComparison, onLockedFeature, steps, completedFixCount, totalFixCount, }) {
    const completionPercent = totalFixCount > 0 ? Math.round((completedFixCount / totalFixCount) * 100) : 0;
    return (<section className="rounded-[1.9rem] border border-slate-200/80 bg-white p-6 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.45)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_22px_50px_-36px_rgba(2,6,23,0.85)] sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
            Step 2 of 7: Action Plan
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">
            Generate the exact optimisation path this page should follow next
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-200">
            This is the main action on the page. It turns the audit from a static report into a guided path the user can work through and return to.
          </p>
        </div>

        <div className="min-w-[15rem] rounded-[1.6rem] border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-700 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
              Progress
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{completionPercent}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#334155_75%,#64748b_100%)] transition-all duration-500" style={{ width: `${completionPercent}%` }}/>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {completedFixCount} of {totalFixCount}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">Recommendations completed</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.7fr_0.9fr_0.9fr_0.9fr]">
        <button type="button" onClick={onTogglePlan} className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_45px_-20px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400">
          {isPlanOpen ? "Hide Full Optimisation Plan" : "Generate Full Optimisation Plan"}
        </button>
        <button type="button" onClick={() => onLockedFeature("Save report")} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
          Save Report
        </button>
        <button type="button" onClick={() => onLockedFeature("Export action plan")} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
          Export Action Plan
        </button>
        <button type="button" onClick={onToggleComparison} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
          {isComparisonOpen ? "Hide Comparison" : "Compare Competitors"}
        </button>
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
        Complete these to improve ranking signals and page clarity. Everything else supports this step.
      </p>

      {isPlanOpen ? (<div className="mt-8 space-y-4 rounded-[1.6rem] border border-slate-200 bg-slate-50/60 p-5 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                Guided workflow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Work through these steps in order to recover visibility, strengthen relevance, and turn score improvements into measurable gains.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-300 dark:bg-slate-700 dark:text-slate-200">
              {steps.length} implementation step{steps.length === 1 ? "" : "s"}
            </div>
          </div>
          {steps.map((step, index) => (<div key={step.id} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-200">{step.description}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  Covers {step.fixIds.length} fix{step.fixIds.length === 1 ? "" : "es"}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Deliverable:</span> {step.deliverable}
              </div>
            </div>))}
        </div>) : null}
    </section>);
}
