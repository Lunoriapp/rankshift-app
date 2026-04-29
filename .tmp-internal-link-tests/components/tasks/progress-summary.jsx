"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressSummary = ProgressSummary;
const metric_card_1 = require("@/components/dashboard/metric-card");
const section_card_1 = require("@/components/dashboard/section-card");
function ProgressSummary({ summary }) {
    return (<section_card_1.SectionCard eyebrow="Progress" title="Task completion summary" description="A quick read on execution momentum, remaining workload, and where the team should focus next.">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[28px] border border-slate-200/70 bg-slate-950 p-6 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
                Completion rate
              </p>
              <p className="mt-3 text-5xl font-semibold tracking-tight">
                {summary.completionPercent}%
              </p>
            </div>
            <p className="max-w-[12rem] text-right text-sm leading-6 text-slate-300">
              {summary.completedTasks} of {summary.totalTasks} tasks completed
            </p>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#34d399_0%,#10b981_100%)] transition-all duration-500" style={{ width: `${summary.completionPercent}%` }}/>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Keep working through high-priority fixes first, then clear medium-impact cleanup tasks.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <metric_card_1.MetricCard label="Open tasks" value={`${summary.openTasks}`} detail="Remaining actions still to ship." tone={summary.openTasks > 0 ? "warning" : "strong"}/>
          <metric_card_1.MetricCard label="Completed" value={`${summary.completedTasks}`} detail="Tasks already closed out." tone="strong"/>
          <metric_card_1.MetricCard label="High priority left" value={`${summary.highPriorityOpenTasks}`} detail="Urgent fixes still waiting." tone={summary.highPriorityOpenTasks > 0 ? "warning" : "strong"}/>
        </div>
      </div>
    </section_card_1.SectionCard>);
}
