"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewritePanel = RewritePanel;
const copy_button_1 = require("@/components/copy-button");
function RewritePanel({ rewrites }) {
    return (<section className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.28)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_18px_36px_-34px_rgba(2,6,23,0.85)] sm:p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
          Step 4 of 7: Rewrites
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
          Use these to implement the improvements cleanly
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-200">
          Use these to apply improvements immediately. These rewrites support implementation after the core fixes are in place.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {rewrites.map(({ label, value, why, intent, target }) => (<div key={label} className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {intent}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {target}
                  </span>
                </div>
                <p className="text-lg font-medium leading-8 text-slate-900 dark:text-slate-100">{value}</p>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#334155_75%,#64748b_100%)]" style={{ width: `${Math.min(100, Math.max(18, Math.round((value.trim().length / (label === "Meta Description" ? 160 : label === "Title" ? 60 : 80)) * 100)))}%` }}/>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  {label === "Title"
                ? "Improves click-through rate and keyword alignment"
                : label === "Meta Description"
                    ? "Improves search snippet conversion"
                    : "Strengthens keyword alignment and page clarity"}
                </p>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-200">{why}</p>
              </div>
              <copy_button_1.CopyButton value={value}/>
            </div>
          </div>))}
      </div>
    </section>);
}
