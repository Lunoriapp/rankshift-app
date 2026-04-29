"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedReportsView = SavedReportsView;
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const supabase_browser_1 = require("@/lib/supabase-browser");
function formatDate(value) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}
function changeTone(change) {
    if (change === null) {
        return "New baseline";
    }
    if (change > 0) {
        return `+${change}`;
    }
    if (change < 0) {
        return `${change}`;
    }
    return "No change";
}
function SavedReportsView() {
    const [reports, setReports] = (0, react_1.useState)([]);
    const [error, setError] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const load = async () => {
            var _a;
            try {
                const accessToken = await (0, supabase_browser_1.getSupabaseAccessToken)();
                const response = await fetch("/api/reports", {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                const payload = (await response.json());
                if (!response.ok || !(payload === null || payload === void 0 ? void 0 : payload.reports)) {
                    throw new Error((_a = payload === null || payload === void 0 ? void 0 : payload.error) !== null && _a !== void 0 ? _a : "Unable to load saved reports.");
                }
                setReports(payload.reports);
            }
            catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Unable to load saved reports.");
            }
            finally {
                setIsLoading(false);
            }
        };
        void load();
    }, []);
    if (isLoading) {
        return (<div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading saved reports...
      </div>);
    }
    if (error) {
        return (<div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm transition-colors duration-300 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
        {error}
      </div>);
    }
    if (reports.length === 0) {
        return (<div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">No saved reports yet</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-200">
          Run your first audit to start building a score history, track completed fixes,
          and turn one-off SEO checks into a repeatable workflow.
        </p>
        <link_1.default href="/" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400">
          Run first audit
        </link_1.default>
      </div>);
    }
    return (<div className="grid gap-4">
      {reports.map((report) => {
            var _a;
            return (<link_1.default key={report.id} href={`/report/${report.id}`} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-[0_18px_40px_-34px_rgba(2,6,23,0.8)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                Saved Report
              </p>
              <h2 className="break-all text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {report.url}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">Created {formatDate(report.created_at)}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[32rem]">
              <div className="rounded-2xl bg-slate-50 p-4 transition-colors duration-300 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  Score
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{report.total}/100</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 transition-colors duration-300 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  Change
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {changeTone(report.changeFromPrevious)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 transition-colors duration-300 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  Opportunity
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {(_a = report.opportunityScore) !== null && _a !== void 0 ? _a : "--"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 transition-colors duration-300 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                  Fixes
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  {report.completedFixCount}/{report.totalFixCount}
                </p>
              </div>
            </div>
          </div>
        </link_1.default>);
        })}
    </div>);
}
