import { ComparisonTable } from "@/components/ComparisonTable";
import {
  buildComparisonRows,
  buildCompetitorInsights,
  type CompetitorComparisonData,
} from "@/lib/competitor-comparison";

interface CompetitorGapSectionProps {
  data: CompetitorComparisonData;
}

function buildApproximateNeeds(data: CompetitorComparisonData): string[] {
  const [competitorA, competitorB] = data.competitors;
  const averageWords = Math.round((competitorA.wordCount + competitorB.wordCount) / 2);
  const averageLinks = Math.round((competitorA.internalLinks + competitorB.internalLinks) / 2);
  const bullets: string[] = [];

  if (data.user.wordCount < averageWords) {
    bullets.push(`+${averageWords - data.user.wordCount} words`);
  }

  if (data.user.internalLinks < averageLinks) {
    bullets.push(`+${averageLinks - data.user.internalLinks} internal links`);
  }

  if (!data.user.schema) {
    bullets.push("Schema added");
  }

  if (!data.user.h1 || data.user.titleLength > 70 || data.user.titleLength < 40) {
    bullets.push("Clearer heading structure");
  }

  if (bullets.length === 0) {
    bullets.push("Stronger page depth", "Tighter internal support", "Sharper structure");
  }

  return bullets.slice(0, 4);
}

export function CompetitorGapSection({ data }: CompetitorGapSectionProps) {
  const rows = buildComparisonRows(data);
  const insights = buildCompetitorInsights(data);
  const approximateNeeds = buildApproximateNeeds(data);

  return (
    <section className="rounded-[1.9rem] border border-slate-800 bg-slate-900 p-6 shadow-[0_24px_60px_-34px_rgba(2,6,23,0.8)] sm:p-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Compare your page against competitors
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
          Why competitors are outranking you
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          We found pages outranking you for this topic. This is the fastest way to see where your page is still behind.
        </p>
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-slate-700 bg-slate-950/70 p-5">
        <p className="text-sm font-semibold text-white">You need approximately:</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {approximateNeeds.map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <ComparisonTable data={data} rows={rows} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.6rem] bg-slate-950/70 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            You are behind because:
          </p>
          <ul className="mt-4 space-y-3">
            {insights.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
                <span className="mt-2 h-2 w-2 rounded-full bg-red-400" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.6rem] bg-slate-950/70 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            What to fix first:
          </p>
          <ul className="mt-4 space-y-3">
            {insights.fixes.map((fix) => (
              <li key={fix} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
