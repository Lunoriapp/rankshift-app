"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = ReportsPage;
const link_1 = __importDefault(require("next/link"));
const auth_bootstrap_1 = require("@/components/auth-bootstrap");
const saved_reports_view_1 = require("@/components/saved-reports-view");
exports.dynamic = "force-dynamic";
function ReportsPage() {
    return (<main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 transition-colors duration-300 dark:bg-none dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <auth_bootstrap_1.AuthBootstrap />
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] sm:p-8">
        <section className="rounded-[24px] border border-slate-200 bg-[#f8f9fd] p-8 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_20px_60px_-32px_rgba(2,6,23,0.8)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                Saved Reports
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
                Your audit workspace
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-200">
                Re-open previous audits, compare score changes, and keep implementation momentum moving from one session to the next.
              </p>
            </div>
            <link_1.default href="/" className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400">
              Run New Audit
            </link_1.default>
          </div>
        </section>

        <saved_reports_view_1.SavedReportsView />
      </div>
    </main>);
}
