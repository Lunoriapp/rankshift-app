"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomePage;
const link_1 = __importDefault(require("next/link"));
const audit_form_1 = require("@/components/audit-form");
const auth_bootstrap_1 = require("@/components/auth-bootstrap");
const marketing_site_header_1 = require("@/components/marketing-site-header");
const iconToneClasses = {
    indigo: "bg-indigo-100 text-indigo-700 ring-indigo-200",
    sky: "bg-sky-100 text-sky-700 ring-sky-200",
    emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-100 text-amber-700 ring-amber-200",
};
const benefits = [
    {
        title: "Find what's blocking your rankings",
        description: "Surface the issues suppressing visibility across search results.",
        icon: (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
        <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>),
        iconTone: "indigo",
    },
    {
        title: "Know exactly what to fix first",
        description: "Get a clear priority order so your team ships high-impact updates first.",
        icon: (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path d="M8 4h8l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3Z" stroke="currentColor" strokeWidth="1.7"/>
        <path d="M8 12h8M8 16h5M8 8h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      </svg>),
        iconTone: "sky",
    },
    {
        title: "Add internal links that improve relevance",
        description: "Uncover contextual link opportunities between your existing pages.",
        icon: (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path d="M9 12a3.5 3.5 0 0 1 0-5l2.5-2.5a3.5 3.5 0 0 1 5 5L15 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M15 12a3.5 3.5 0 0 1 0 5l-2.5 2.5a3.5 3.5 0 1 1-5-5L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>),
        iconTone: "indigo",
    },
];
const auditCoverage = [
    {
        title: "Technical issues",
        description: "Detect crawl and indexability problems that hold back performance.",
        icon: (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6M18.2 18.2l-1.6-1.6M7.4 7.4 5.8 5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>),
        iconTone: "emerald",
    },
    {
        title: "On-page fixes",
        description: "Get direct recommendations for titles, headings, and content quality.",
        icon: (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path d="M7 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 5 20V4a.5.5 0 0 1 .5-.5H7Z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 11h8M8 15h6M8 7h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>),
        iconTone: "sky",
    },
    {
        title: "Internal links",
        description: "See where to add links to improve topical relevance and discoverability.",
        icon: (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path d="M9 12a3.5 3.5 0 0 1 0-5l2.5-2.5a3.5 3.5 0 0 1 5 5L15 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M15 12a3.5 3.5 0 0 1 0 5l-2.5 2.5a3.5 3.5 0 1 1-5-5L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>),
        iconTone: "indigo",
    },
    {
        title: "AI visibility",
        description: "Spot gaps that limit how your pages appear in AI-driven answers.",
        icon: (<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path d="m12 4 2.1 4.9 4.9 2.1-4.9 2.1L12 18l-2.1-4.9L5 11l4.9-2.1L12 4Z" stroke="currentColor" strokeWidth="1.8"/>
      </svg>),
        iconTone: "amber",
    },
];
function HomePage() {
    return (<main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <auth_bootstrap_1.AuthBootstrap />
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)]">
        <marketing_site_header_1.MarketingSiteHeader />

        <section id="scan-start" className="px-4 py-8 sm:px-8 lg:px-10 lg:pb-10 lg:pt-8">
          <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="max-w-[560px]">
              <p className="inline-flex rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                AI-powered SEO audit
              </p>
              <h1 className="mt-4 max-w-[17ch] text-3xl font-semibold leading-[1.1] tracking-tight text-slate-950 sm:mt-5 sm:max-w-[18ch] sm:text-4xl lg:text-6xl">
                See why your page isn't showing in{" "}
                <span className="text-blue-600">Google</span> and{" "}
                <span className="text-indigo-600">AI results</span>
              </h1>
              <p className="mt-3 max-w-xl text-base leading-6 text-slate-600 sm:mt-5 sm:text-xl sm:leading-8">
                Run a focused scan to find missed visibility, priority fixes, and internal links you can ship straight away.
              </p>
              <audit_form_1.AuditForm buttonLabel="Scan My Page" className="max-w-[560px]" helperText="No need to include https://" showHighlights={false}/>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500 sm:mt-4">
                {[
            "No sign-up required",
            "Results in under 60 seconds",
            "Works on any website",
        ].map((item) => (<span key={item} className="inline-flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-indigo-600" fill="none" aria-hidden="true">
                        <path d="m6.5 12.5 3.2 3.2 7.8-7.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {item}
                  </span>))}
              </div>
              <p className="mt-3 text-sm text-slate-600 sm:mt-4 sm:text-base">
                Built for <span className="font-semibold text-indigo-600">modern search and AI</span>
              </p>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)] sm:p-4">
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

              <div className="space-y-3 p-2 pt-3 sm:space-y-4 sm:pt-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                  <p className="text-xs font-medium text-indigo-700">
                    Preview only · final results generated after your live scan
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                    <div className="h-full w-1/2 rounded-full bg-indigo-500"/>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Sample page format
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-3xl">yourwebsite.com/page</p>
                    <p className="mt-1 text-xs text-slate-500">Illustrative layout preview</p>
                  </div>
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-emerald-400 bg-emerald-50 text-slate-900 sm:h-20 sm:w-20 sm:rounded-2xl">
                    <p className="text-2xl font-semibold leading-none sm:text-3xl">78</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Score</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  {[
            ["Issues found", "24", "text-rose-600"],
            ["Critical", "7", "text-rose-600"],
            ["Links", "32", "text-indigo-600"],
            ["Potential lift", "+21", "text-emerald-600"],
        ].map(([label, value, valueColor]) => (<div key={label} className="rounded-xl border border-slate-200 px-3 py-3">
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <p className={`mt-1 text-3xl font-semibold tracking-tight ${valueColor}`}>{value}</p>
                    </div>))}
                </div>
                <div className="hidden gap-3 sm:grid sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">Top issues</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {[
            "Title tag too long",
            "Missing meta description",
            "H1 tag missing",
            "Image missing ALT text",
        ].map((issue) => (<p key={issue} className="flex items-center gap-2">
                          <span className="text-rose-500">△</span>
                          {issue}
                        </p>))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">Internal links to add</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Add from /blog/seo-tips to /seo-tools</p>
                      <p>Add from /services/seo to /case-studies</p>
                      <p className="pt-1 font-semibold text-indigo-600">View all link opportunities &rarr;</p>
                    </div>
                  </div>
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
                {[
            {
                label: "Source page",
                value: "/blog/seo-tips",
                accent: "text-slate-900",
                icon: (<svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" aria-hidden="true">
                        <path d="M7 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 5 20V4a.5.5 0 0 1 .5-.5H7Z" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>),
            },
            {
                label: "Suggested anchor",
                value: "future of web design",
                accent: "text-indigo-600",
                icon: (<svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" aria-hidden="true">
                        <path d="M9 12a3.5 3.5 0 0 1 0-5l2.5-2.5a3.5 3.5 0 0 1 5 5L15 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M15 12a3.5 3.5 0 0 1 0 5l-2.5 2.5a3.5 3.5 0 1 1-5-5L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>),
            },
            {
                label: "Target page",
                value: "/seo-services",
                accent: "text-slate-900",
                icon: (<svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>),
            },
            {
                label: "Why this matters",
                value: "This link connects related topics, improves crawl paths, and strengthens topical relevance between pages.",
                accent: "text-slate-600",
                icon: (<svg viewBox="0 0 24 24" className="h-5 w-5 text-indigo-600" fill="none" aria-hidden="true">
                        <path d="M12 20.5a2.3 2.3 0 0 0 2.3-2.3h-4.6a2.3 2.3 0 0 0 2.3 2.3Z" fill="currentColor"/>
                        <path d="M16.4 14.9v-3.2a4.4 4.4 0 1 0-8.8 0v3.2l-1.4 1.4h11.6l-1.4-1.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                      </svg>),
            },
        ].map((item) => (<div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex gap-3">
                      <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ${iconToneClasses.indigo}`}>
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {item.label}
                        </p>
                        <p className={`mt-1 text-sm ${item.accent} ${item.label === "Suggested anchor" ? "font-semibold" : "font-medium"}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </div>))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Content match preview
                </p>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="h-3.5 w-3/4 rounded bg-slate-200"/>
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, lineIndex) => (<div key={`content-line-${lineIndex}`} className={`h-2.5 rounded bg-slate-200 ${lineIndex === 2 ? "w-[92%]" : "w-full"}`}/>))}
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    ...the{" "}
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-semibold text-indigo-700">
                      future of web design
                    </span>{" "}
                    is shaped by AI tools...
                  </div>
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, lineIndex) => (<div key={`content-line-bottom-${lineIndex}`} className={`h-2.5 rounded bg-slate-200 ${lineIndex === 2 ? "w-2/3" : "w-full"}`}/>))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/80 px-6 py-6 sm:px-8 lg:px-10">
          <div className="grid gap-4 md:grid-cols-3">
            {benefits.map((item) => (<article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset ${iconToneClasses[item.iconTone]}`}>
                  {item.icon}
                </div>
                <p className="text-2xl font-semibold leading-tight text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>))}
          </div>
        </section>

        <section className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              What you&apos;ll get
            </h2>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {auditCoverage.map((item) => (<article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-inset ${iconToneClasses[item.iconTone]}`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>))}
          </div>
        </section>

        <section className="border-t border-slate-100 bg-white px-6 py-10 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Scan your page now
            </h2>
            <div className="mt-6">
              <link_1.default href="#scan-start" className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(79,70,229,0.95)] transition hover:brightness-105">
                Scan My Page
              </link_1.default>
            </div>
            <p className="mt-3 text-sm text-slate-500">Free · No credit card · Results in under 60 seconds</p>
          </div>
        </section>
      </div>
    </main>);
}
