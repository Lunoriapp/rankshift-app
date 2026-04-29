"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HowItWorksPage;
const link_1 = __importDefault(require("next/link"));
const marketing_page_shell_1 = require("@/components/marketing-page-shell");
const steps = [
    {
        number: "01",
        title: "Enter your page URL",
        description: "Start with any page you want to improve.",
    },
    {
        number: "02",
        title: "Run the audit",
        description: "Rankshift scans core SEO signals and builds a clear action list.",
    },
    {
        number: "03",
        title: "Implement fixes",
        description: "Use direct recommendations and internal link suggestions.",
    },
    {
        number: "04",
        title: "Rerun and improve",
        description: "Track score movement and continue improving the page.",
    },
];
function HowItWorksPage() {
    return (<marketing_page_shell_1.MarketingPageShell>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">How it works</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        A simple workflow built for quick execution
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        The process is designed so you can get clarity fast and act without overthinking.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {steps.map((step) => (<article key={step.number} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{step.number}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{step.description}</p>
          </article>))}
      </div>

      <div className="mt-8">
        <link_1.default href="/start-free-audit" className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105">
          Start Free Audit
        </link_1.default>
      </div>
    </marketing_page_shell_1.MarketingPageShell>);
}
