"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { MarketingPageShell } from "@/components/marketing-page-shell";

const plans = [
  {
    name: "Growth",
    cadence: "Monthly",
    bullets: [
      "Advanced internal linking suggestions",
      "History and score tracking",
      "Priority execution workflow",
    ],
  },
  {
    name: "Best value",
    cadence: "Yearly",
    bullets: [
      "Everything in Growth",
      "Long-term tracking and trend visibility",
      "Best-value billing for ongoing execution",
    ],
    featured: true,
  },
];

export default function PricingContent() {
  const searchParams = useSearchParams();
  const analysedUrl = searchParams.get("analysedUrl");
  const score = searchParams.get("score");
  const issuesCount = searchParams.get("issuesCount");
  const hasUpgradeContext = Boolean(analysedUrl || score || issuesCount);

  return (
    <MarketingPageShell>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Pricing</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Plans for teams that need clear SEO execution
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Choose the plan that fits your workflow and scale.
      </p>

      {hasUpgradeContext ? (
        <section className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">You&apos;re upgrading this page:</p>
          {analysedUrl ? (
            <p className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]">{analysedUrl}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
            {score ? <p>Score: {score}</p> : null}
            {issuesCount ? <p>Issues found: {issuesCount}</p> : null}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-xl border p-5 ${
              plan.featured
                ? "border-indigo-300 bg-indigo-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">{plan.name}</p>
            <p className="mt-2 text-sm font-medium text-slate-600">{plan.cadence}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {plan.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/start-free-audit"
          className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
        >
          Start tracking
        </Link>
      </div>
    </MarketingPageShell>
  );
}
