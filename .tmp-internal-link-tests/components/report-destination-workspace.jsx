"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportDestinationWorkspace = ReportDestinationWorkspace;
const navigation_1 = require("next/navigation");
const react_1 = require("react");
const fix_list_1 = require("@/components/fix-list");
const history_panel_1 = require("@/components/history-panel");
const rewrite_panel_1 = require("@/components/rewrite-panel");
const supabase_browser_1 = require("@/lib/supabase-browser");
function SectionShell({ title, description, children, }) {
    return (<section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">{title}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-6">{children}</div>
    </section>);
}
function LockedPreview({ title, preview, }) {
    return (<section className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/40 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800 dark:text-amber-300">🔒 Preview</p>
      <h2 className="mt-2 text-2xl font-semibold text-amber-950 dark:text-amber-100">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-amber-900 dark:text-amber-200">
        {preview.map((item) => (<li key={item}>• {item}</li>))}
      </ul>
      <button type="button" className="mt-6 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400">
        Upgrade to unlock
      </button>
    </section>);
}
function ReportDestinationWorkspace({ reportId, section }) {
    var _a, _b, _c, _d, _e, _f;
    const searchParams = (0, navigation_1.useSearchParams)();
    const isPaid = searchParams.get("plan") === "paid";
    const [payload, setPayload] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const load = async () => {
            var _a;
            try {
                const accessToken = await (0, supabase_browser_1.getSupabaseAccessToken)();
                const response = await fetch(`/api/reports/${reportId}`, {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                const nextPayload = (await response.json());
                if (!response.ok || !("audit" in nextPayload)) {
                    throw new Error((_a = nextPayload.error) !== null && _a !== void 0 ? _a : "Unable to load report.");
                }
                setPayload(nextPayload);
            }
            catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Unable to load report.");
            }
            finally {
                setIsLoading(false);
            }
        };
        void load();
    }, [reportId]);
    const completedFixIds = (0, react_1.useMemo)(() => {
        var _a;
        return (_a = payload === null || payload === void 0 ? void 0 : payload.fixStates.filter((state) => state.completed).map((state) => state.fix_id)) !== null && _a !== void 0 ? _a : [];
    }, [payload]);
    if (isLoading) {
        return (<main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-slate-950 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Loading...
        </div>
      </main>);
    }
    if (error || !payload) {
        return (<main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-slate-950 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error !== null && error !== void 0 ? error : "Unable to load this section."}
        </div>
      </main>);
    }
    const rewrites = [
        {
            label: "Title",
            value: payload.audit.ai_output.rewrites.title,
            why: "Use this title to improve click-through and intent alignment.",
            intent: "Ranking and click-through",
            target: "Ideal length: 10-60 characters",
        },
        {
            label: "Meta Description",
            value: payload.audit.ai_output.rewrites.description,
            why: "Use this description to improve search snippet conversion.",
            intent: "Search snippet conversion",
            target: "Ideal length: 50-160 characters",
        },
        {
            label: "H1",
            value: payload.audit.ai_output.rewrites.h1,
            why: "Use this H1 to strengthen page relevance and structure.",
            intent: "On-page relevance and clarity",
            target: "One clear page-defining H1",
        },
    ];
    const headingMap = [
        { key: "Meta", value: payload.audit.score.pillars.meta.score, max: payload.audit.score.pillars.meta.maxScore },
        { key: "Headings", value: payload.audit.score.pillars.headings.score, max: payload.audit.score.pillars.headings.maxScore },
        { key: "Images", value: payload.audit.score.pillars.images.score, max: payload.audit.score.pillars.images.maxScore },
        { key: "Performance", value: payload.audit.score.pillars.performance.score, max: payload.audit.score.pillars.performance.maxScore },
        { key: "Schema", value: payload.audit.score.pillars.schema.score, max: payload.audit.score.pillars.schema.maxScore },
        { key: "Internal linking", value: payload.audit.score.pillars.internalLinking.score, max: payload.audit.score.pillars.internalLinking.maxScore },
        {
            key: "AI & LLM Visibility",
            value: (_b = (_a = payload.audit.score.pillars.aiVisibility) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : 0,
            max: (_d = (_c = payload.audit.score.pillars.aiVisibility) === null || _c === void 0 ? void 0 : _c.maxScore) !== null && _d !== void 0 ? _d : 20,
        },
    ];
    return (<main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <a href={`/report/${reportId}${isPaid ? "?plan=paid" : ""}`} className="text-sm font-semibold text-sky-700 dark:text-sky-300">← Back to results</a>

        {section === "details" ? (<SectionShell title="Full audit details" description="Full implementation view for fixes, internal links, and rewrite suggestions.">
            <fix_list_1.FixList fixes={payload.audit.fixes} images={payload.audit.crawl.images} internalLinkOpportunities={(_f = (_e = payload.audit.crawl.internalLinking) === null || _e === void 0 ? void 0 : _e.opportunities) !== null && _f !== void 0 ? _f : []} completedFixIds={completedFixIds} onToggleFix={() => undefined} onToggleOpportunity={() => undefined} feedbackMessage={null}/>
            <div className="mt-6">
              <rewrite_panel_1.RewritePanel rewrites={rewrites}/>
            </div>
          </SectionShell>) : null}

        {section === "scoring" ? (<SectionShell title="Scoring logic" description="See how each scoring category contributes to the page score.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {headingMap.map((item) => (<div key={item.key} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.key}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{item.value}<span className="text-lg text-slate-400">/{item.max}</span></p>
                </div>))}
            </div>
          </SectionShell>) : null}

        {section === "history" ? (isPaid ? (<history_panel_1.HistoryPanel history={payload.history} onLockedFeature={() => undefined}/>) : (<LockedPreview title="Scan history" preview={[
                "Score movement over time",
                "Completed actions",
                "Scan-to-scan comparisons",
            ]}/>)) : null}

        {section === "insights" ? (isPaid ? (<SectionShell title="Premium insights" description="Competitor-driven strategic opportunities for stronger SEO growth.">
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <p>• Competitor topic gaps</p>
                <p>• Stronger heading suggestions</p>
                <p>• Advanced content opportunities</p>
              </div>
            </SectionShell>) : (<LockedPreview title="Premium insights" preview={[
                "Competitor topic gaps",
                "Stronger heading suggestions",
                "Advanced content opportunities",
            ]}/>)) : null}

        {section === "export" ? (isPaid ? (<SectionShell title="Export centre" description="Download and share report outputs.">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-sky-500 dark:text-slate-950">Export PDF</button>
                <button type="button" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Export CSV</button>
                <button type="button" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Share client view</button>
              </div>
            </SectionShell>) : (<LockedPreview title="Export centre" preview={[
                "PDF export",
                "CSV export",
                "Shareable client view",
            ]}/>)) : null}
      </div>
    </main>);
}
