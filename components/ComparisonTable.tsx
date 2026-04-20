"use client";

import type { ComparisonMetricRow, CompetitorComparisonData } from "@/lib/competitor-comparison";

interface ComparisonTableProps {
  data: CompetitorComparisonData;
  rows: ComparisonMetricRow[];
}

function toneClasses(tone: ComparisonMetricRow["userTone"]): string {
  if (tone === "strong") {
    return "text-emerald-300";
  }

  if (tone === "weak") {
    return "text-red-300";
  }

  return "text-slate-200";
}

function indicatorClasses(tone: ComparisonMetricRow["userTone"]): string {
  if (tone === "strong") {
    return "bg-emerald-400";
  }

  if (tone === "weak") {
    return "bg-red-400";
  }

  return "bg-slate-500";
}

export function ComparisonTable({ data, rows }: ComparisonTableProps) {
  const [competitorA, competitorB] = data.competitors;

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-slate-800 bg-slate-900 shadow-[0_24px_60px_-34px_rgba(2,6,23,0.7)]">
      <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr] gap-px bg-slate-800">
        <div className="bg-slate-900 px-4 py-4" />
        <div className="bg-slate-900 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Your Page
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {competitorA.name}
          </p>
        </div>
        <div className="bg-slate-900 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {competitorB.name}
          </p>
        </div>

        {rows.map((row) => (
          <div key={row.key} className="contents">
            <div key={`${row.key}-label`} className="bg-slate-900 px-4 py-4">
              <p className="text-sm font-medium text-slate-200">{row.label}</p>
            </div>
            <div key={`${row.key}-user`} className="bg-slate-900 px-4 py-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${indicatorClasses(row.userTone)}`} />
                <span className={`text-sm font-semibold ${toneClasses(row.userTone)}`}>
                  {row.userValue}
                </span>
              </div>
            </div>
            <div key={`${row.key}-a`} className="bg-slate-900 px-4 py-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${indicatorClasses(row.competitorATone)}`} />
                <span className={`text-sm font-semibold ${toneClasses(row.competitorATone)}`}>
                  {row.competitorAValue}
                </span>
              </div>
            </div>
            <div key={`${row.key}-b`} className="bg-slate-900 px-4 py-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${indicatorClasses(row.competitorBTone)}`} />
                <span className={`text-sm font-semibold ${toneClasses(row.competitorBTone)}`}>
                  {row.competitorBValue}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
