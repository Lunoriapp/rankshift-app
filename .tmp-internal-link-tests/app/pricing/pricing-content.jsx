"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PricingContent;
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const marketing_page_shell_1 = require("@/components/marketing-page-shell");
function PricingContent() {
    const searchParams = (0, navigation_1.useSearchParams)();
    const analysedUrl = searchParams.get("analysedUrl");
    const score = searchParams.get("score");
    const issuesCount = searchParams.get("issuesCount");
    const hasUpgradeContext = Boolean(analysedUrl || score || issuesCount);
    return (<marketing_page_shell_1.MarketingPageShell>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Pricing</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Plans for teams that need clear SEO execution
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Choose the plan that fits your workflow and scale.
      </p>

      {hasUpgradeContext ? (<section className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">You&apos;re upgrading this page:</p>
          {analysedUrl ? (<p className="mt-1 text-sm text-slate-700 [overflow-wrap:anywhere]">{analysedUrl}</p>) : null}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
            {score ? <p>Score: {score}</p> : null}
            {issuesCount ? <p>Issues found: {issuesCount}</p> : null}
          </div>
        </section>) : null}

      <section className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/60 p-5">
        <p className="text-sm font-semibold text-slate-900">This page is missing visibility right now</p>
        <p className="mt-1 text-sm text-slate-700">Start fixing it today</p>
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">Growth</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">£12/month</p>
          <p className="mt-1 text-sm text-slate-600">Cancel anytime</p>
        </div>
        <div className="mt-4">
          <link_1.default href="/start-free-audit" className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105">
            Fix this page now
          </link_1.default>
        </div>
        <p className="mt-2 text-xs text-slate-500">Takes less than 60 seconds to start</p>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Save with yearly</p>
        <p className="mt-1 text-sm text-slate-700">
          Keep progress moving with long-term tracking and lower annual cost.
        </p>
        <div className="mt-3">
          <link_1.default href="/pricing?plan=yearly" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
            Save with yearly
          </link_1.default>
        </div>
      </section>

      <div className="mt-6">
        <link_1.default href="/start-free-audit" className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
          Start tracking
        </link_1.default>
      </div>
    </marketing_page_shell_1.MarketingPageShell>);
}
