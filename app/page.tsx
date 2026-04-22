import Link from "next/link";

import { AuditForm } from "@/components/audit-form";
import { AuthBootstrap } from "@/components/auth-bootstrap";

const proofPoints = [
  "See real issues",
  "Add internal links with context",
  "Get rewrite suggestions",
  "Track progress over time",
];

const features = [
  {
    title: "See what to fix",
    description:
      "Surface the issues holding a page back and know which fixes deserve attention first.",
  },
  {
    title: "Know where to link",
    description:
      "Find the best internal link opportunities with source context, target pages, and usable anchor text.",
  },
  {
    title: "Improve faster",
    description:
      "Move from audit to action with rewrites, priorities, and history that shows whether changes worked.",
  },
];

const audiences = [
  {
    title: "SEO consultants",
    description:
      "Audit client pages quickly, show clear next actions, and keep recommendations easy to justify.",
  },
  {
    title: "In-house marketers",
    description:
      "Prioritise fixes, improve internal linking, and track SEO progress without a bloated workflow.",
  },
  {
    title: "Site owners",
    description:
      "Understand what is holding a page back and get practical fixes you can apply right away.",
  },
];

const steps = [
  {
    number: "01",
    title: "Enter a URL",
    description:
      "Start with any live page you want to improve and pull it straight into the audit workspace.",
  },
  {
    number: "02",
    title: "Run the audit",
    description:
      "Rankshift checks metadata, headings, images, structure, and internal linking to surface the clearest next actions.",
  },
  {
    number: "03",
    title: "Apply fixes and track progress",
    description:
      "Work through the recommendations, re-scan the page, and see how score, issues, and link gaps move over time.",
  },
];

export default function HomePage() {
  return (
    <main
      id="top"
      className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_34%,#eef4ff_100%)] px-6 py-10 text-slate-900 transition-colors duration-300 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_40%,#111827_100%)] dark:text-slate-100 sm:px-8 lg:px-10"
    >
      <AuthBootstrap />
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-white shadow-[0_28px_80px_-44px_rgba(15,23,42,0.45)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-[0_28px_80px_-44px_rgba(2,6,23,0.85)]">
          <div className="relative px-6 py-14 sm:px-10 sm:py-18 lg:px-16 lg:py-20">
            <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%)]" />
            <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Rankshift
              </span>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-5xl lg:text-6xl">
                See what to fix, where to link, and how to improve SEO
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                Run a page audit to uncover the issues hurting performance, find the internal links
                worth adding, and get clearer next steps to improve rankings.
              </p>

              <AuditForm
                buttonLabel="Run free audit"
                className="mt-8 w-full border-slate-200/90 bg-white/95 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.3)]"
              />
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                No setup. Results in seconds.
              </p>

              <div className="mt-6 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {proofPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span>Built for fast page audits and repeatable SEO improvements.</span>
                <Link
                  href="/report/101"
                  className="rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-900 transition hover:border-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900"
                >
                  View example report
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-[0_24px_60px_-40px_rgba(2,6,23,0.85)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Why teams use it
          </p>
          <div className="mt-5 space-y-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 px-4 py-4 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/80"
              >
                <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
            Each audit includes a score, priority fixes, rewrite suggestions, and internal link opportunities.
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-[0_24px_60px_-40px_rgba(2,6,23,0.85)] sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Who it&apos;s for
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              Built for the people responsible for SEO outcomes
            </h2>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {audiences.map((audience) => (
              <div
                key={audience.title}
                className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 transition-colors duration-300 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]"
              >
                <h3 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  {audience.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{audience.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-[0_24px_60px_-40px_rgba(2,6,23,0.85)] sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              How it works
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              A fast path from audit to action
            </h2>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 transition-colors duration-300 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)]"
              >
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {step.number}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] px-6 py-10 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)] transition-colors duration-300 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#111827_0%,#0f172a_100%)] dark:shadow-[0_24px_60px_-36px_rgba(2,6,23,0.85)] sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                Start now
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Run your first audit
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                See what is limiting a real page, understand the fixes that matter most, and move
                into a report you can actually use.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#top"
                className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
              >
                Run free audit
              </Link>
              <Link
                href="/report/101"
                className="rounded-2xl border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900/70"
              >
                View example report
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
