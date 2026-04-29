"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = StartFreeAuditPage;
const link_1 = __importDefault(require("next/link"));
const audit_form_1 = require("@/components/audit-form");
const auth_bootstrap_1 = require("@/components/auth-bootstrap");
const marketing_site_header_1 = require("@/components/marketing-site-header");
exports.metadata = {
    title: "Start Free Audit | Rankshift",
    description: "Run a free Rankshift SEO audit to uncover missed visibility in Google and AI results, prioritized fixes, and internal link opportunities.",
};
const valueItems = [
    {
        title: "Find the right issues",
        description: "Spot technical and on-page blockers that reduce visibility in search and AI answers.",
    },
    {
        title: "Get prioritized fixes",
        description: "See what to fix first based on likely impact so teams can ship meaningful improvements.",
    },
    {
        title: "Unlock internal links",
        description: "Discover contextual links between existing pages to strengthen topic relevance and crawl paths.",
    },
    {
        title: "Move with confidence",
        description: "Get clear next actions instead of long reports that leave teams guessing what to do next.",
    },
];
const coverageItems = [
    {
        title: "Technical SEO checks",
        description: "Surface crawl, indexability, metadata, and structure issues that can hold rankings back.",
    },
    {
        title: "On-page optimization",
        description: "Review headings, title tags, and content depth with direct recommendations.",
    },
    {
        title: "Internal link opportunities",
        description: "Identify contextual source pages, target pages, and anchor ideas you can implement quickly.",
    },
    {
        title: "AI and LLM visibility signals",
        description: "Highlight gaps that limit discoverability across modern AI-assisted search journeys.",
    },
    {
        title: "Action-first next steps",
        description: "Get a focused task list you can execute immediately, not a generic export.",
    },
];
function StartFreeAuditPage() {
    return (<main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <auth_bootstrap_1.AuthBootstrap />
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)]">
        <marketing_site_header_1.MarketingSiteHeader />

        <section id="audit-entry" className="px-6 pb-8 pt-8 sm:px-8 lg:px-10 lg:pb-10">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="max-w-[560px]">
              <p className="inline-flex rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                AI-powered SEO audit
              </p>
              <h1 className="mt-5 max-w-[16ch] text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
                See what&apos;s holding your page back in search and AI results
              </h1>
              <p className="mt-5 max-w-xl text-xl leading-8 text-slate-600">
                Run a focused scan to uncover missed visibility opportunities, prioritized fixes, and internal links you can ship right away.
              </p>
              <audit_form_1.AuditForm buttonLabel="Run Audit" className="max-w-[560px]" helperText="No need to include https://" showHighlights={false}/>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-2 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300"/>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300"/>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300"/>
                </div>
                <p className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  Example audit result
                </p>
              </div>

              <div className="space-y-4 p-2 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Sample service page · scan completed in 9s
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">yourwebsite.com/seo-services</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Illustrative preview to show the report format before you run your own audit.
                    </p>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-emerald-400 bg-emerald-50 text-slate-900">
                    <p className="text-3xl font-semibold leading-none">78</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Score</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  {[
            ["Issues found", "24", "text-rose-600"],
            ["Critical issues", "7", "text-rose-600"],
            ["Internal links", "32", "text-indigo-600"],
            ["Potential lift", "+21", "text-emerald-600"],
        ].map(([label, value, valueColor]) => (<div key={label} className="rounded-xl border border-slate-200 px-3 py-3">
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <p className={`mt-1 text-3xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
                    </div>))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">Top issues detected</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Title tag is too long for intent-led query terms</p>
                      <p>Meta description missing on high-converting page</p>
                      <p>H1 does not match search intent closely enough</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">Internal links to add</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Add link from `/blog/seo-tips` to `/seo-services`</p>
                      <p>Add link from `/local-seo-guide` to `/case-studies`</p>
                      <p className="pt-1 font-semibold text-indigo-600">Prioritized recommendations in report</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/80 px-6 py-6 sm:px-8 lg:px-10">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {valueItems.map((item) => (<article key={item.title} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-base font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>))}
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              What you&apos;ll get in your free audit
            </h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">
              A product-style report built for action, so your team can improve visibility without wasting cycles.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {coverageItems.map((item) => (<article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>))}
          </div>

          <div className="mt-8 flex justify-center">
            <link_1.default href="#audit-entry" className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(79,70,229,0.95)] transition hover:brightness-105">
              Run Audit
            </link_1.default>
          </div>
        </section>
      </div>
    </main>);
}
