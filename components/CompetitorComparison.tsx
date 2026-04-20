"use client";

import { useMemo, useState } from "react";

import { ComparisonTable } from "@/components/ComparisonTable";
import { InsightBlock } from "@/components/InsightBlock";
import { LockedPremiumSection } from "@/components/LockedPremiumSection";
import {
  buildComparisonRows,
  buildCompetitorInsights,
  competitorComparisonData,
} from "@/lib/competitor-comparison";

interface CompetitorComparisonProps {
  onUnlock: (feature: string) => void;
}

export function CompetitorComparison({ onUnlock }: CompetitorComparisonProps) {
  const [showPremiumSection, setShowPremiumSection] = useState(true);

  const rows = useMemo(() => buildComparisonRows(competitorComparisonData), []);
  const insights = useMemo(
    () => buildCompetitorInsights(competitorComparisonData),
    [],
  );

  return (
    <section className="rounded-[1.9rem] border border-slate-800 bg-slate-950 p-6 shadow-[0_26px_70px_-38px_rgba(2,6,23,0.8)] sm:p-8">
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
        <ComparisonTable data={competitorComparisonData} rows={rows} />
        <InsightBlock reasons={insights.reasons} fixes={insights.fixes} />
        {showPremiumSection ? (
          <LockedPremiumSection
            onUnlock={() => onUnlock("Competitor insights")}
            onDismiss={() => setShowPremiumSection(false)}
          />
        ) : null}
      </div>
    </section>
  );
}
