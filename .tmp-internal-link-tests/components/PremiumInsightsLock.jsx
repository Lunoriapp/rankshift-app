"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PremiumInsightsLock = PremiumInsightsLock;
const react_1 = require("react");
function PremiumInsightsLock({ onUnlock }) {
    const [dismissed, setDismissed] = (0, react_1.useState)(false);
    if (dismissed) {
        return (<section className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 text-sm text-slate-600 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Competitor insights are still here when you want the deeper breakdown.
      </section>);
    }
    return (<section className="relative overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_50%)]"/>
      <div className="relative p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Premium insights
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
            Unlock the exact gaps competitors are winning with
          </h2>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
            'Keyword gap: "managed seo..." terms missing in key sections',
            'Suggested heading: "Why [service] fails..." angle not covered',
            'Topic gap: proof-driven use cases are thin vs top pages',
            "Competitor advantage: stronger internal support around money pages",
        ].map((item) => (<div key={item} className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 blur-[1.5px] dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
                {item}
              </div>))}
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/80">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                See the exact gaps they are winning with, including missing intent terms, structure gaps, and topic coverage holes.
              </p>
              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p>• Uncover the keyword and topic gaps blocking rankings</p>
                <p>• Get the exact heading angles they already use</p>
                <p>• Prioritise what to add first to close the gap</p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onUnlock} className="flex-1 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
                  See the exact gaps they are winning with
                </button>
                <button type="button" onClick={() => setDismissed(true)} className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800">
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);
}
