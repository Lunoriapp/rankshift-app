import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing-page-shell";

const plans = [
  {
    name: "Starter",
    price: "Free",
    bullets: [
      "Run core page audits",
      "Get issue summaries",
      "See basic recommendations",
    ],
  },
  {
    name: "Pro",
    price: "£49/mo",
    bullets: [
      "Advanced internal linking suggestions",
      "History and score tracking",
      "Priority execution workflow",
    ],
    featured: true,
  },
  {
    name: "Agency",
    price: "£129/mo",
    bullets: [
      "Multi-workspace management",
      "Team collaboration support",
      "Higher crawl and report limits",
    ],
  },
];

export default function PricingPage() {
  return (
    <MarketingPageShell>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Pricing</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Plans for teams that need clear SEO execution
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Choose the plan that fits your workflow and scale.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
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
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{plan.price}</p>
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
          href="/#start-audit"
          className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
        >
          Start Free Audit
        </Link>
      </div>
    </MarketingPageShell>
  );
}
