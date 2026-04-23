import Link from "next/link";

import { AuditForm } from "@/components/audit-form";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import { MarketingSiteHeader } from "@/components/marketing-site-header";

const benefits = [
  {
    title: "Find what's blocking your rankings",
    description: "Surface the issues suppressing visibility across search results.",
  },
  {
    title: "Know exactly what to fix first",
    description: "Get a clear priority order so your team ships high-impact updates first.",
  },
  {
    title: "Add internal links that improve relevance",
    description: "Uncover contextual link opportunities between your existing pages.",
  },
];

const auditCoverage = [
  {
    title: "Technical issues",
    description: "Detect crawl and indexability problems that hold back performance.",
  },
  {
    title: "On-page fixes",
    description: "Get direct recommendations for titles, headings, and content quality.",
  },
  {
    title: "Internal links",
    description: "See where to add links to improve topical relevance and discoverability.",
  },
  {
    title: "AI visibility",
    description: "Spot gaps that limit how your pages appear in AI-driven answers.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <AuthBootstrap />
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)]">
        <MarketingSiteHeader />

        <section id="scan-start" className="px-6 pb-8 pt-8 sm:px-8 lg:px-10 lg:pb-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="max-w-[560px]">
              <p className="inline-flex rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                AI-powered SEO audit
              </p>
              <h1 className="mt-5 max-w-[16ch] text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
                See why your page isn&apos;t showing in Google and AI results
              </h1>
              <p className="mt-5 max-w-xl text-xl leading-8 text-slate-600">
                Run a focused scan to find missed visibility, priority fixes, and internal links you can ship straight away.
              </p>
              <AuditForm
                buttonLabel="Scan My Page"
                className="max-w-[560px]"
                helperText="No need to include https://"
                showHighlights={false}
              />
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-2 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                <p className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Example audit result
                </p>
              </div>

              <div className="space-y-4 p-2 pt-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                  <p className="text-xs font-medium text-indigo-700">
                    Preview only · final results generated after your live scan
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                    <div className="h-full w-1/2 rounded-full bg-indigo-500" />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Sample page format
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">yourwebsite.com/page</p>
                    <p className="mt-1 text-xs text-slate-500">Illustrative layout preview</p>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-emerald-400 bg-emerald-50 text-slate-900">
                    <p className="text-3xl font-semibold leading-none">78</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Score</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ["Issues found", "24", "text-rose-600"],
                    ["Critical", "7", "text-rose-600"],
                    ["Links", "32", "text-indigo-600"],
                    ["Potential lift", "+21", "text-emerald-600"],
                  ].map(([label, value, valueColor]) => (
                    <div key={label} className="rounded-xl border border-slate-200 px-3 py-3">
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <p className={`mt-1 text-3xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-t border-slate-100 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Real example output
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              See the kind of action Rankshift gives you
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
              Not vague advice. A direct recommendation your team can review and implement.
            </p>
          </div>

          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)] sm:p-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Source page
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">/blog/seo-tips</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-indigo-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
                    Suggested anchor
                  </p>
                  <p className="mt-1 text-sm font-semibold text-indigo-700">future of web design</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Target page
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">/seo-services</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Why this matters
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    This link connects related topics, improves crawl paths, and strengthens topical relevance between pages.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Content match preview
                </p>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 7 }).map((_, lineIndex) => (
                      <div
                        key={`content-line-${lineIndex}`}
                        className={`h-2.5 rounded bg-slate-200 ${
                          lineIndex === 3 ? "w-[92%]" : lineIndex === 6 ? "w-2/3" : "w-full"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 inline-flex rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                    future of web design
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/80 px-6 py-6 sm:px-8 lg:px-10">
          <div className="grid gap-4 md:grid-cols-3">
            {benefits.map((item) => (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-base font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              What you&apos;ll get
            </h2>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {auditCoverage.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 bg-white px-6 py-10 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Scan your page now
            </h2>
            <div className="mt-6">
              <Link
                href="#scan-start"
                className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(79,70,229,0.95)] transition hover:brightness-105"
              >
                Scan My Page
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
