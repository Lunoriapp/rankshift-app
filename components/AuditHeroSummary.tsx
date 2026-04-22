interface AuditHeroSummaryProps {
  url: string;
  score: number;
  issuesFound: number;
  competitorGap: number;
  status: "Strong" | "Competitive" | "Needs improvement" | "At risk";
  headline: string;
  summary: string;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}

function formatCompetitorGap(value: number): string {
  if (value <= 0) {
    return "Level";
  }

  return `-${value} pts`;
}

export function AuditHeroSummary({
  url,
  score,
  issuesFound,
  competitorGap,
  status,
  headline,
  summary,
  onPrimaryAction,
  onSecondaryAction,
}: AuditHeroSummaryProps) {
  const statusTone =
    status === "Strong"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
      : status === "Competitive"
        ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
        : status === "Needs improvement"
          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200";

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.3)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_30px_80px_-40px_rgba(2,6,23,0.8)]">
      <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.2fr_0.8fr] xl:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              SEO Audit Summary
            </p>
            <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusTone}`}>
              {status}
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl xl:text-[3.8rem] xl:leading-[0.96]">
              {headline}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              {summary}
            </p>
            <p className="break-all text-sm text-slate-500 dark:text-slate-400">{url}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onPrimaryAction}
              className="rounded-2xl bg-sky-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Fix this page now
            </button>
            <button
              type="button"
              onClick={onSecondaryAction}
              className="rounded-2xl border border-slate-300 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              View top fixes
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] bg-slate-100 px-4 py-4 dark:bg-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                SEO Score
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{score}/100</p>
            </div>
            <div className="rounded-[1.35rem] bg-slate-100 px-4 py-4 dark:bg-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Issues Found
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{issuesFound}</p>
            </div>
            <div className="rounded-[1.35rem] bg-slate-100 px-4 py-4 dark:bg-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Competitor Gap
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {formatCompetitorGap(competitorGap)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-stretch">
          <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_55%)]" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Current Position
              </p>
              <p className="mt-5 text-7xl font-semibold tracking-[-0.06em] text-slate-950 dark:text-white">{score}</p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
                Rankings move when the highest-impact fixes ship first. Use the top fixes list below to close the gap quickly.
              </p>
            </div>

            <div className="relative rounded-[1.45rem] bg-white/90 px-4 py-4 dark:bg-slate-900/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                What matters now
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                Clean up the highest-impact issues, then use the competitor gap block below to see exactly where stronger pages are beating you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
