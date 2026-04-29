"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FeaturesPage;
const link_1 = __importDefault(require("next/link"));
const marketing_page_shell_1 = require("@/components/marketing-page-shell");
const features = [
    {
        title: "Find the right issues",
        description: "Scan metadata, headings, performance, schema, and internal linking in one run.",
    },
    {
        title: "Get direct fixes",
        description: "Clear recommendations that tell you what to change and why it matters.",
    },
    {
        title: "Add contextual internal links",
        description: "Get source phrase, target page, and reason so implementation is fast.",
    },
    {
        title: "Track score improvements",
        description: "Rerun audits and see issue count and score movement over time.",
    },
];
function FeaturesPage() {
    return (<marketing_page_shell_1.MarketingPageShell>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Features</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Everything you need to move from audit to action
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Rankshift is built to make SEO improvements obvious and fast to implement.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (<article key={feature.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-950">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </article>))}
      </div>

      <div className="mt-8">
        <link_1.default href="/start-free-audit" className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105">
          Start Free Audit
        </link_1.default>
      </div>
    </marketing_page_shell_1.MarketingPageShell>);
}
