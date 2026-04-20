"use client";

import { useState } from "react";

interface PremiumInsightsLockProps {
  onUnlock: () => void;
}

export function PremiumInsightsLock({ onUnlock }: PremiumInsightsLockProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <section className="rounded-[1.8rem] border border-slate-800 bg-slate-900 px-5 py-5 text-sm text-slate-300">
        Competitor insights are still here when you want the deeper breakdown.
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[1.9rem] border border-slate-800 bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_50%)]" />
      <div className="relative p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Premium insights
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
            Unlock the exact gaps competitors are winning with
          </h2>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Keyword gap: service page intent terms",
              "Keyword gap: trust and proof modifiers",
              "Suggested heading: Add a stronger problem-solution H2",
              "Topic gap: competitors cover commercial use cases more directly",
              "Advantage: stronger internal support around the core offer",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-700 bg-slate-950/70 px-4 py-4 text-sm text-slate-300 blur-[1.5px]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[1.6rem] border border-slate-700 bg-slate-950/80 p-6">
              <p className="text-sm leading-7 text-slate-200">
                See the missing terms, headings, and topic coverage helping competitors outrank this page.
              </p>
              <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                <p>• See keyword gaps</p>
                <p>• Get content structure to outrank them</p>
                <p>• Generate full rewrite plan</p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onUnlock}
                  className="flex-1 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  Unlock competitor insights
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="flex-1 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
