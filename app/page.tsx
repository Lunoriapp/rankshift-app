import Link from "next/link";
import type { ReactNode } from "react";

import { AuditForm } from "@/components/audit-form";
import { AuthBootstrap } from "@/components/auth-bootstrap";

const navItems = [
  { label: "Features", href: "/features" },
  { label: "How it Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
];

type FeatureItem = {
  title: string;
  description: string;
  icon: ReactNode;
};

const topFeatureStrip: FeatureItem[] = [
  {
    title: "Find the Right Issues",
    description: "We scan your page in depth to find what's holding your rankings back.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Get Clear Fixes",
    description: "Actionable recommendations you can implement right away.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" aria-hidden="true">
        <path
          d="M9.5 20.5H4a1 1 0 0 1-1-1V14l11.3-11.3a1.7 1.7 0 0 1 2.4 0l4.6 4.6a1.7 1.7 0 0 1 0 2.4L10 21a1 1 0 0 1-.5.3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="m13.5 4.5 6 6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    title: "Add Smart Internal Links",
    description: "Find contextual link opportunities to boost relevance and rankings.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" aria-hidden="true">
        <path
          d="M9 12a3.5 3.5 0 0 1 0-5l2.5-2.5a3.5 3.5 0 0 1 5 5L15 11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15 12a3.5 3.5 0 0 1 0 5l-2.5 2.5a3.5 3.5 0 1 1-5-5L9 13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Know Your Next Move",
    description: "Prioritized next steps so you always know what to focus on.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" aria-hidden="true">
        <path d="M12 3.5V12l5.5 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
];

const outcomes = [
  {
    value: "Clear",
    valueClassName: "text-3xl sm:text-4xl",
    title: "Priority fixes first",
    description: "Resolve the issues most likely to hold back visibility",
  },
  {
    value: "Natural",
    valueClassName: "text-3xl sm:text-4xl",
    title: "Internal links from real content",
    description: "Use existing phrases on the page as clean anchor text",
  },
  {
    value: "Stronger",
    valueClassName: "text-3xl sm:text-4xl",
    title: "Visibility across search surfaces",
    description: "Improve coverage in classic results, AI overviews, and assistants",
  },
];

const builtFor = [
  {
    title: "SEO Professionals",
    description: "Deliver better results for your clients.",
  },
  {
    title: "Agencies",
    description: "Scale audits and recommendations.",
  },
  {
    title: "Business Owners",
    description: "Improve your site without the guesswork.",
  },
  {
    title: "Content Creators",
    description: "Make every page more discoverable.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <AuthBootstrap />
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)]">
        <header className="border-b border-slate-100 px-6 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div className="text-4xl font-semibold tracking-tight text-slate-950">
              Rankshift
            </div>
            <nav className="hidden items-center gap-9 text-sm font-medium text-slate-600 lg:flex">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="transition hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="hidden text-sm font-semibold text-slate-700 transition hover:text-slate-950 sm:inline-flex"
              >
                Log in
              </button>
              <a
                href="#start-audit"
                className="rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(79,70,229,0.95)] transition hover:brightness-105"
              >
                Start Free Audit
              </a>
            </div>
          </div>
        </header>

        <section className="px-6 pb-8 pt-8 sm:px-8 lg:px-10 lg:pb-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="max-w-[560px]">
              <p className="inline-flex rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                AI-powered SEO audits
              </p>
              <h1 className="mt-5 max-w-[14ch] text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
                Fix pages for{" "}
                <span className="text-indigo-600">Google, ChatGPT, and AI search</span>
              </h1>
              <p className="mt-5 max-w-lg text-xl leading-7 text-slate-600">
                Get a clear action plan to improve rankings, add better internal links, and increase visibility across modern search and AI results.
              </p>
              <div id="start-audit">
                <AuditForm
                  buttonLabel="Run Audit ->"
                  className="max-w-[560px]"
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Works for Google, AI overviews, and LLM-driven search
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)]">
              <div className="flex items-center gap-2 border-b border-slate-100 px-2 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <div className="grid gap-4 p-2 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">What you'll get from this scan</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                      yourwebsite.com
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Scanned just now</p>
                  </div>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-emerald-400 text-4xl font-semibold text-slate-900">
                    78
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ["Issues found", "24"],
                    ["Critical issues", "7"],
                    ["Internal links", "32"],
                    ["Improve score", "+21"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-200 px-3 py-3">
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">Top issues</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Title tag too long</p>
                      <p>Missing meta description</p>
                      <p>H1 tag missing</p>
                      <p>Image missing ALT text</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">Internal links to add</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>
                        Add from <span className="font-semibold">/blog/seo-tips</span> to{" "}
                        <span className="font-semibold">/seo-tools</span>
                      </p>
                      <p>
                        Add from <span className="font-semibold">/services/seo</span> to{" "}
                        <span className="font-semibold">/case-studies</span>
                      </p>
                      <p className="pt-1 font-semibold text-indigo-600">
                        View all link opportunities &rarr;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/80 px-6 py-6 sm:px-8 lg:px-10">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {topFeatureStrip.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  {item.icon}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">Internal links · Opportunity</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                    Add this contextual link
                  </h2>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600">
                      Source page: /blog/seo-tips
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-slate-700">
                      Suggested anchor: "...using the right <span className="font-semibold">SEO tools</span> ..."
                    </div>
                    <div className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600">
                      Target page: /seo-tools
                    </div>
                    <p className="text-slate-600">
                      This link helps users discover a relevant resource and strengthens topical relevance between pages.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your page content</p>
                  <div className="mt-3 space-y-2">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <div
                        key={`line-${index}`}
                        className={`h-2.5 rounded bg-slate-200 ${index === 4 ? "bg-emerald-200" : ""}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.13em] text-indigo-600">
                Contextual. Relevant. Actionable.
              </p>
              <h3 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-[2.4rem]">
                Internal links from your existing page content
              </h3>
              <p className="mt-4 text-xl leading-8 text-slate-600">
                We show you the exact words to link, the page to link to, and why it matters.
              </p>
              <ul className="mt-5 space-y-3 text-base text-slate-700">
                <li>Contextual anchor text from your content</li>
                <li>Related pages that deserve a link</li>
                <li>Boost relevance, crawlability, and rankings</li>
                <li>Easy to review and implement</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-6 px-6 pb-8 sm:px-8 lg:grid-cols-[1.6fr_1fr] lg:px-10">
          <div className="rounded-2xl bg-[#f5f4ff] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.13em] text-indigo-600">
              Practical outcomes after implementation
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {outcomes.map((item) => (
                <div key={item.title} className="rounded-xl bg-white px-4 py-4">
                  <p
                    className={`${item.valueClassName} font-semibold leading-tight tracking-tight text-slate-950`}
                  >
                    {item.value}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#f5f4ff] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.13em] text-indigo-600">Built for</p>
            <div className="mt-4 space-y-4">
              {builtFor.map((item) => (
                <div key={item.title}>
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-8 sm:px-8 lg:px-10">
          <div className="rounded-2xl bg-[#f1f0ff] px-4 py-6 text-center sm:px-8">
            <h2 className="mx-auto max-w-3xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Run a scan and get your next SEO + AI actions
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-base leading-6 text-slate-600 sm:text-lg sm:leading-7">
              Enter any URL to get fix priorities, internal link opportunities, and AI visibility improvements in seconds.
            </p>
            <div className="mx-auto max-w-2xl">
              <AuditForm buttonLabel="Run Audit ->" className="mx-auto" />
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-100 px-6 py-5 text-sm text-slate-600 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-slate-900">Rankshift</p>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/features" className="hover:text-slate-900">
                Features
              </Link>
              <Link href="/how-it-works" className="hover:text-slate-900">
                How it Works
              </Link>
              <Link href="/pricing" className="hover:text-slate-900">
                Pricing
              </Link>
              <Link href="/resources" className="hover:text-slate-900">
                Resources
              </Link>
              <Link href="/reports" className="hover:text-slate-900">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
