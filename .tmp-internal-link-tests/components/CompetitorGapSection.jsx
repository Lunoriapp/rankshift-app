"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitorGapSection = CompetitorGapSection;
const ComparisonTable_1 = require("@/components/ComparisonTable");
const competitor_comparison_1 = require("@/lib/competitor-comparison");
function buildApproximateNeeds(data) {
    if (data.competitors.length === 0) {
        return [];
    }
    const averageWords = Math.round(data.competitors.reduce((sum, item) => sum + item.wordCount, 0) /
        data.competitors.length);
    const averageLinks = Math.round(data.competitors.reduce((sum, item) => sum + item.internalLinks, 0) /
        data.competitors.length);
    const bullets = [];
    if (data.user.wordCount < averageWords) {
        bullets.push(`+${averageWords - data.user.wordCount} words needed`);
    }
    if (data.user.internalLinks < averageLinks) {
        bullets.push(`+${averageLinks - data.user.internalLinks} internal links needed`);
    }
    if (!data.user.schema) {
        bullets.push("Schema markup needed");
    }
    if (!data.user.h1 || data.user.titleLength > 70 || data.user.titleLength < 40) {
        bullets.push("Clearer heading structure needed");
    }
    if (bullets.length === 0) {
        bullets.push("Competitor baseline matched", "Hold internal support", "Keep structure sharp");
    }
    return bullets.slice(0, 4);
}
function CompetitorGapSection({ data }) {
    const rows = (0, competitor_comparison_1.buildComparisonRows)(data);
    const insights = (0, competitor_comparison_1.buildCompetitorInsights)(data);
    const approximateNeeds = buildApproximateNeeds(data);
    return (<section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_24px_60px_-34px_rgba(2,6,23,0.8)] sm:p-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Compare your page against competitors
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
          Why competitors are outranking you
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">Close these gaps first.</p>
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/70">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">You are behind by:</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {approximateNeeds.map((item) => (<span key={item} className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {item}
            </span>))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <ComparisonTable_1.ComparisonTable data={data} rows={rows}/>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.6rem] bg-slate-50 px-5 py-5 dark:bg-slate-950/70">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            You are behind because
          </p>
          <ul className="mt-4 space-y-3">
            {insights.reasons.map((reason) => (<li key={reason} className="flex items-start gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                <span className="mt-2 h-2 w-2 rounded-full bg-red-400"/>
                <span>{reason}</span>
              </li>))}
          </ul>
        </section>

        <section className="rounded-[1.6rem] bg-slate-50 px-5 py-5 dark:bg-slate-950/70">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            What to fix first
          </p>
          <ul className="mt-4 space-y-3">
            {insights.fixes.map((fix) => (<li key={fix} className="flex items-start gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400"/>
                <span>{fix}</span>
              </li>))}
          </ul>
        </section>
      </div>
    </section>);
}
