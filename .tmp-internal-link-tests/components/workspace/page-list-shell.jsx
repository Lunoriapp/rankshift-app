"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacePageListShell = WorkspacePageListShell;
const page_row_1 = require("@/components/workspace/page-row");
function sortPages(pages) {
    const priorityRank = {
        critical: 0,
        high: 1,
        medium: 2,
        good: 3,
    };
    return [...pages].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] ||
        a.score - b.score ||
        b.issueCount - a.issueCount);
}
function WorkspacePageListShell({ pages }) {
    const sortedPages = sortPages(pages);
    const criticalCount = pages.filter((page) => page.priority === "critical").length;
    const highCount = pages.filter((page) => page.priority === "high").length;
    const healthyCount = pages.filter((page) => page.priority === "good").length;
    return (<main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] sm:p-8">
        <section className="rounded-[24px] border border-slate-200 bg-[#f8f9fd] p-8 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Rankshift Workspace
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Pages that need attention next
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                This view ranks every tracked page by urgency so the weakest pages surface first.
                Open any row to jump straight into its audit and fix workflow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50/90 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700/80">
                  Critical
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-red-900">
                  {criticalCount}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700/80">
                  High
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-900">
                  {highCount}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
                  Good
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-900">
                  {healthyCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.3)] sm:p-6">
          <div className="mb-4 hidden grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] items-center border-b border-slate-200/80 px-2 pb-4 lg:grid">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Page
            </p>
            <div className="grid grid-cols-[0.85fr_0.9fr_0.9fr]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Score
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Last scanned
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Priority
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedPages.map((page) => (<page_row_1.WorkspacePageRow key={page.id} page={page}/>))}
          </div>
        </section>
      </div>
    </main>);
}
