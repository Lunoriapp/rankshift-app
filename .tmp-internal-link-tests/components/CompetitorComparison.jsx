"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitorComparison = CompetitorComparison;
const react_1 = require("react");
const ComparisonTable_1 = require("@/components/ComparisonTable");
const InsightBlock_1 = require("@/components/InsightBlock");
const LockedPremiumSection_1 = require("@/components/LockedPremiumSection");
const competitor_comparison_1 = require("@/lib/competitor-comparison");
function CompetitorComparison({ onUnlock }) {
    const [showPremiumSection, setShowPremiumSection] = (0, react_1.useState)(true);
    const rows = (0, react_1.useMemo)(() => (0, competitor_comparison_1.buildComparisonRows)(competitor_comparison_1.competitorComparisonData), []);
    const insights = (0, react_1.useMemo)(() => (0, competitor_comparison_1.buildCompetitorInsights)(competitor_comparison_1.competitorComparisonData), []);
    return (<section className="rounded-[1.9rem] border border-slate-800 bg-slate-950 p-6 shadow-[0_26px_70px_-38px_rgba(2,6,23,0.8)] sm:p-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Competitor comparison
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[2rem]">
          Compare your page against competitors
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          We found pages outranking you for this topic.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <ComparisonTable_1.ComparisonTable data={competitor_comparison_1.competitorComparisonData} rows={rows}/>
        <InsightBlock_1.InsightBlock reasons={insights.reasons} fixes={insights.fixes}/>
        {showPremiumSection ? (<LockedPremiumSection_1.LockedPremiumSection onUnlock={() => onUnlock("Competitor insights")} onDismiss={() => setShowPremiumSection(false)}/>) : null}
      </div>
    </section>);
}
