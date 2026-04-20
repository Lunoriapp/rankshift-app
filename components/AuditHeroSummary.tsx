interface AuditHeroSummaryProps {
  url: string;
  score: number;
  issuesFound: number;
  competitorGap: number;
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
  onPrimaryAction,
  onSecondaryAction,
}: AuditHeroSummaryProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-[0_30px_80px_-40px_rgba(2,6,23,0.8)]">
      <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.2fr_0.8fr] xl:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              SEO Audit Summary
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl xl:text-[3.8rem] xl:leading-[0.96]">
              You are losing rankings to stronger pages
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Fix these top issues first to improve clarity, internal strength, and page competitiveness.
            </p>
            <p className="break-all text-sm text-slate-400">{url}</p>
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
              className="rounded-2xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
            >
              View top issues
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.35rem] bg-slate-800 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                SEO Score
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{score}/100</p>
            </div>
            <div className="rounded-[1.35rem] bg-slate-800 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Issues Found
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{issuesFound}</p>
            </div>
            <div className="rounded-[1.35rem] bg-slate-800 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Competitor Gap
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {formatCompetitorGap(competitorGap)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-stretch">
          <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[1.8rem] border border-slate-700 bg-slate-950 p-6">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_55%)]" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Current Position
              </p>
              <p className="mt-5 text-7xl font-semibold tracking-[-0.06em] text-white">{score}</p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                The quickest win is to tighten the main page signals first, then close the gap competitors have built in structure and internal strength.
              </p>
            </div>

            <div className="relative rounded-[1.45rem] bg-slate-900/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                What matters now
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Clean up the highest-impact issues, then use the competitor gap block below to see exactly where stronger pages are beating you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
