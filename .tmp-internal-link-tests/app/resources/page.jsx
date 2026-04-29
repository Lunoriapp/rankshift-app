"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResourcesPage;
const link_1 = __importDefault(require("next/link"));
const marketing_page_shell_1 = require("@/components/marketing-page-shell");
const resources = [
    {
        title: "Internal linking playbook",
        description: "How to choose contextual anchors and strengthen topic clusters.",
    },
    {
        title: "SEO audit checklist",
        description: "A practical checklist for metadata, headings, links, and performance.",
    },
    {
        title: "Fix prioritization guide",
        description: "Decide what to fix first based on impact and effort.",
    },
    {
        title: "Content refresh framework",
        description: "Keep pages current and maintain ranking momentum over time.",
    },
];
function ResourcesPage() {
    return (<marketing_page_shell_1.MarketingPageShell>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Resources</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Guides to help you execute SEO faster
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Useful reference content for teams implementing ongoing SEO improvements.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {resources.map((resource) => (<article key={resource.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-950">{resource.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{resource.description}</p>
          </article>))}
      </div>

      <div className="mt-8">
        <link_1.default href="/start-free-audit" className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105">
          Start Free Audit
        </link_1.default>
      </div>
    </marketing_page_shell_1.MarketingPageShell>);
}
