import Link from "next/link";

import type { AuditRecord } from "@/lib/supabase";
import type { OpportunityAssessment } from "@/lib/scorer";

interface ReportSummaryProps {
  audit: AuditRecord;
  opportunity: OpportunityAssessment;
  completedFixCount: number;
  totalFixCount: number;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ReportSummary({
  audit,
  opportunity,
  completedFixCount,
  totalFixCount,
}: ReportSummaryProps) {
  const progressPercent =
    totalFixCount > 0 ? Math.round((completedFixCount / totalFixCount) * 100) : 0;
  const remainingFixes = Math.max(totalFixCount - completedFixCount, 0);

  return (
    <section className="overflow-hidden rounded-[2.1rem] border border-slate-200/80 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_30px_80px_-40px_rgba(2,6,23,0.85)]">
      <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.38fr_0.62fr] xl:p-10">
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Saved Audit
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Updated {formatDate(audit.created_at)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              Step 1 of 7: Summary
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl xl:text-[4.2rem] xl:leading-[0.95]">
              SEO Audit Results
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-200 sm:text-lg">
              This page now has a clear optimisation path. Start with the highest-impact fixes, apply the rewrites where needed, and use score movement to verify that the changes are improving visibility.
            </p>
            <p className="break-all text-sm text-slate-500 dark:text-slate-300">{audit.url}</p>
          </div>

          <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50/80 p-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                  Progress Momentum
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
                  {remainingFixes > 0
                    ? `${remainingFixes} remaining fixes are still limiting ranking signals and page clarity.`
                    : "All current recommendations are complete. Re-run the audit to validate the gains."}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm transition-colors duration-300 dark:bg-slate-800">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                  Completion
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {progressPercent}%
                </p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#334155_68%,#64748b_100%)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50/80 p-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Total Score
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {audit.score.total}/{audit.score.maxScore}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Based on 6 optimisation categories.
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50/80 p-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Opportunity Score
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                {opportunity.score}/100
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
                How strong this page could become once the blocked signals are fixed.
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50/80 p-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Estimated Upside
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                +{opportunity.uplift}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">
                Projected score after the current recommendations are implemented.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-[1.9rem] bg-slate-950 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.22),transparent_55%)]" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Potential Positioning
            </p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold tracking-[-0.04em]">{opportunity.label}</p>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
                  {opportunity.rationale}
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-5 py-4 text-right backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Projected
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {opportunity.projectedScore}/100
                </p>
              </div>
            </div>
          </div>

          <div className="relative space-y-3">
            <div className="rounded-[1.55rem] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Next best move
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Generate the optimisation plan, complete the fixes that most limit visibility, then re-run the audit to confirm the score is moving upward.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Re-run Audit
              </Link>
              <Link
                href="/reports"
                className="rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-center text-sm font-semibold text-slate-300 transition hover:bg-white/5"
              >
                View Saved Reports
              </Link>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              This report is part of a repeat-use workspace, so every improvement can be tracked instead of disappearing after one session.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
