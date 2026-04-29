"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryPanel = HistoryPanel;
const history_1 = require("@/lib/history");
function formatDate(value) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}
function interpretationToneClasses(tone) {
    if (tone === "positive") {
        return "border-emerald-200 bg-emerald-50 text-emerald-950";
    }
    if (tone === "warning") {
        return "border-amber-200 bg-amber-50 text-amber-950";
    }
    return "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100";
}
function getComparisonValue(value, options) {
    var _a, _b;
    if (value === null) {
        return {
            value: "0",
            helper: (_a = options === null || options === void 0 ? void 0 : options.baselineLabel) !== null && _a !== void 0 ? _a : "first scan",
        };
    }
    return {
        value: (0, history_1.formatHistoryDelta)(value, (_b = options === null || options === void 0 ? void 0 : options.invertMeaning) !== null && _b !== void 0 ? _b : false),
    };
}
function getMetricDeltaNote(value, options) {
    var _a, _b;
    if (value === null) {
        return (_a = options === null || options === void 0 ? void 0 : options.baselineLabel) !== null && _a !== void 0 ? _a : "first scan";
    }
    if (value === 0) {
        return null;
    }
    return (0, history_1.formatHistoryDelta)(value, (_b = options === null || options === void 0 ? void 0 : options.invertMeaning) !== null && _b !== void 0 ? _b : false);
}
function getDeltaTone(value) {
    if (value === null || value === 0) {
        return "text-slate-950";
    }
    return value > 0 ? "text-emerald-600" : "text-red-600";
}
function HistoryPanel({ history, onLockedFeature }) {
    var _a, _b;
    const latestEntry = history[0];
    const interpretation = (0, history_1.interpretAuditHistory)(latestEntry);
    return (<section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.28)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_18px_36px_-34px_rgba(2,6,23,0.85)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
              Step 6 of 7: Tracking
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
              Score history and scan history
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-200">
              Re-scans only matter if they help you see movement. This view keeps score changes,
              issue changes, and internal linking shifts lightweight but easy to interpret.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-700 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Current score
            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {(_a = latestEntry === null || latestEntry === void 0 ? void 0 : latestEntry.score) !== null && _a !== void 0 ? _a : "--"}/100
            </div>
          </div>
        </div>

        <div className={`mt-6 rounded-[1.4rem] border px-4 py-4 text-sm leading-7 ${interpretationToneClasses(interpretation.tone)}`}>
          <span className="font-semibold">{interpretation.headline}.</span> {interpretation.body}
        </div>

        {latestEntry ? (<div className="mt-6 grid gap-3 sm:grid-cols-5">
            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-5 text-center transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
              <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-slate-400">
                PREVIOUS
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {(_b = latestEntry.previousScore) !== null && _b !== void 0 ? _b : "--"}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-5 text-center transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
              <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-slate-400">
                CURRENT
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                {latestEntry.score}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-5 text-center transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
              <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-slate-400">
                CHANGE
              </p>
              <p className={`mt-3 text-4xl font-semibold tracking-[-0.04em] ${getDeltaTone(latestEntry.scoreDelta)}`}>
                {(0, history_1.formatHistoryDelta)(latestEntry.scoreDelta)}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-5 text-center transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
              <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-slate-400">
                ISSUES
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                {(0, history_1.formatHistoryDelta)(latestEntry.issueCountDelta, true)}
              </p>
            </div>
            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-5 text-center transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
              <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-slate-400">
                LINK GAPS
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                {(0, history_1.formatHistoryDelta)(latestEntry.internalLinkOpportunityDelta, true)}
              </p>
            </div>
          </div>) : null}

        <div className="mt-6 space-y-3">
          {history.map((entry, index) => {
            const changeDisplay = getComparisonValue(entry.scoreDelta);
            const issuesNote = getMetricDeltaNote(entry.issueCountDelta, {
                invertMeaning: true,
            });
            const linkGapsNote = getMetricDeltaNote(entry.internalLinkOpportunityDelta, {
                invertMeaning: true,
            });
            return (<div key={entry.id} className="flex flex-col gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-4 py-4 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-[110px]">
                  <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-900 dark:text-slate-100">
                    {index === 0 ? "CURRENT" : "PREVIOUS"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{formatDate(entry.created_at)}</p>
                </div>
                <div className="grid flex-1 gap-4 sm:grid-cols-[1.1fr_1fr_0.9fr_0.9fr_auto] sm:items-center">
                  <div>
                    <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      SCORE
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-100">
                      {entry.score}
                    </p>
                  </div>
                  <div>
                    <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      CHANGE
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-100">
                      {changeDisplay.value}
                    </p>
                    {changeDisplay.helper ? (<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{changeDisplay.helper}</p>) : null}
                  </div>
                  <div>
                    <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      ISSUES
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-100">
                      {entry.issueCount}
                    </p>
                    {issuesNote ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{issuesNote}</p> : null}
                  </div>
                  <div>
                    <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      LINK GAPS
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-100">
                      {entry.internalLinkOpportunityCount}
                    </p>
                    {linkGapsNote ? (<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{linkGapsNote}</p>) : null}
                  </div>
                  <div className="sm:justify-self-end">
                    {/* Reintroduce a report-open action here once scan history can link to distinct saved reports. */}
                  </div>
                </div>
              </div>);
        })}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.28)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_18px_36px_-34px_rgba(2,6,23,0.85)] sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
          Step 7 of 7: Advanced Visibility Tools
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
          Unlock the next layer after implementation
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-200">
          These upgrade paths are placed here on purpose: once the user has seen fixes, rewrites, score movement, and scan history, they are ready for deeper ongoing value.
        </p>
        <div className="mt-4 space-y-4">
          {[
            {
                title: "See if your fixes are actually improving performance over time",
                body: "Unlock longer-term tracking across multiple pages and surface trend movement automatically instead of checking manually.",
            },
            {
                title: "Identify why competitors are outranking you",
                body: "Benchmark the page against competitor URLs using the same scoring and rewrite framework.",
            },
            {
                title: "Export a polished report clients or teams can act on",
                body: "Package the audit into a shareable action plan for internal teams, clients, or stakeholders.",
            },
        ].map((item) => (<button key={item.title} type="button" onClick={() => onLockedFeature(item.title)} className="group block w-full rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700/90">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition group-hover:border-slate-400 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:group-hover:border-slate-600">
                  Locked
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-200">{item.body}</p>
            </button>))}
        </div>
      </div>
    </section>);
}
