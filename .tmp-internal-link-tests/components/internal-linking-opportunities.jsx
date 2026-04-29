"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalLinkingOpportunities = InternalLinkingOpportunities;
const react_1 = require("react");
const copy_button_1 = require("@/components/copy-button");
const internal_linking_empty_state_1 = require("@/components/internal-linking-empty-state");
function confidenceTone(confidence) {
    if (confidence === "High") {
        return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-slate-700 dark:text-sky-300";
    }
    if (confidence === "Medium") {
        return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-slate-700 dark:text-sky-300";
    }
    return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200";
}
function statusTone(isCompleted) {
    return isCompleted
        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
        : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
}
function formatDomain(value) {
    try {
        return new URL(value).hostname.replace(/^www\./, "");
    }
    catch (_a) {
        return value;
    }
}
function highlightAnchor(snippet, anchor) {
    if (!anchor) {
        return <span>{snippet}</span>;
    }
    const lowerSnippet = snippet.toLowerCase();
    const lowerAnchor = anchor.toLowerCase();
    const matchIndex = lowerSnippet.indexOf(lowerAnchor);
    if (matchIndex === -1) {
        return <span>{snippet}</span>;
    }
    const before = snippet.slice(0, matchIndex);
    const match = snippet.slice(matchIndex, matchIndex + anchor.length);
    const after = snippet.slice(matchIndex + anchor.length);
    return (<span>
      {before}
      <mark className="rounded-md bg-amber-100 px-1.5 py-0.5 font-medium text-slate-950 dark:bg-amber-950/70 dark:text-amber-100">
        {match}
      </mark>
      {after}
    </span>);
}
function buildCopySuggestion(opportunity) {
    var _a, _b;
    return [
        `Source page: ${opportunity.sourceTitle}`,
        `Source URL: ${opportunity.sourceUrl}`,
        `Destination page: ${opportunity.targetTitle}`,
        `Destination URL: ${opportunity.targetUrl}`,
        `Anchor opportunity: ${(_a = opportunity.suggestedAnchor) !== null && _a !== void 0 ? _a : "Content improvement opportunity"}`,
        `Rewrite suggestion: ${(_b = opportunity.rewriteSuggestion) !== null && _b !== void 0 ? _b : "n/a"}`,
        `Anchor context: ${opportunity.matchedSnippet}`,
        `Best placement: ${opportunity.placementHint}`,
        `Why this link helps: ${opportunity.reason}`,
    ].join("\n");
}
function InternalLinkingOpportunities({ opportunities, completedOpportunityIds, onToggleOpportunity, initialVisibleCount = 5, }) {
    const [showAll, setShowAll] = (0, react_1.useState)(false);
    const [showLowConfidence, setShowLowConfidence] = (0, react_1.useState)(false);
    const [feedbackMessage, setFeedbackMessage] = (0, react_1.useState)(null);
    const sortedOpportunities = (0, react_1.useMemo)(() => [...opportunities].sort((a, b) => b.confidenceScore - a.confidenceScore), [opportunities]);
    const lowConfidenceOpportunities = sortedOpportunities.filter((opportunity) => opportunity.confidence === "Low");
    const defaultConfidenceOpportunities = sortedOpportunities.filter((opportunity) => opportunity.confidence !== "Low");
    const confidenceScopedOpportunities = showLowConfidence
        ? sortedOpportunities
        : defaultConfidenceOpportunities;
    const visibleOpportunities = showAll
        ? confidenceScopedOpportunities
        : confidenceScopedOpportunities.slice(0, Math.max(3, initialVisibleCount));
    const completedCount = opportunities.filter((opportunity) => completedOpportunityIds.includes(opportunity.id)).length;
    const openCount = opportunities.length - completedCount;
    const contextualCount = opportunities.filter((opportunity) => { var _a; return ((_a = opportunity.opportunityType) !== null && _a !== void 0 ? _a : "contextual") === "contextual"; }).length;
    const relatedCount = opportunities.filter((opportunity) => opportunity.opportunityType === "related").length;
    (0, react_1.useEffect)(() => {
        for (const opportunity of visibleOpportunities) {
            console.log("FINAL ANCHOR:", opportunity.suggestedAnchor);
        }
    }, [visibleOpportunities]);
    return (<section className="rounded-[32px] border border-white/60 bg-white/82 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_20px_60px_rgba(2,6,23,0.7)] sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-300">
            Internal linking
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            Add these internal links next
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            See exactly what phrase to link, where to send it, and why it helps rankings and user journey.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
              Total
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {opportunities.length}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
              Open
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {openCount}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
              Contextual
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {contextualCount}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
              Related pages
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {relatedCount}
            </p>
          </div>
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/90 px-4 py-4 dark:border-emerald-800 dark:bg-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300">
              Completed
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950 dark:text-slate-50">
              {completedCount}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Showing {visibleOpportunities.length} of {sortedOpportunities.length} suggestions.
        </p>
        {sortedOpportunities.length > Math.max(3, initialVisibleCount) ? (<button type="button" onClick={() => setShowAll((current) => !current)} className="text-sm font-semibold text-sky-700 transition hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">
            {showAll ? "Show top suggestions" : "View all link suggestions"}
          </button>) : null}
        {lowConfidenceOpportunities.length > 0 ? (<button type="button" onClick={() => setShowLowConfidence((current) => !current)} className="text-sm font-semibold text-slate-600 transition hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100">
            {showLowConfidence
                ? "Hide low confidence suggestions"
                : `Show low confidence suggestions (${lowConfidenceOpportunities.length})`}
          </button>) : null}
      </div>

      {feedbackMessage ? (<div className="mt-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
          {feedbackMessage}
        </div>) : null}

      <div className="mt-4 space-y-3">
        {visibleOpportunities.length > 0 ? (visibleOpportunities.map((opportunity) => {
            const isCompleted = completedOpportunityIds.includes(opportunity.id);
            return (<article key={opportunity.id} className={`rounded-[28px] border px-5 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all ${isCompleted
                    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-slate-800"
                    : "border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800"}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-slate-700/80 dark:text-slate-200">
                        Internal link opportunity
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${confidenceTone(opportunity.confidence)}`}>
                        {opportunity.confidence}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(isCompleted)}`}>
                        {isCompleted ? "Completed" : "Open"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                          Source page
                        </p>
                        <p className="mt-2 text-base font-semibold leading-7 tracking-tight text-slate-950 dark:text-slate-50">
                          {opportunity.sourceTitle}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-300">
                          {formatDomain(opportunity.sourceUrl)}
                        </p>
                      </div>

                      <div className="hidden pt-7 text-slate-300 dark:text-slate-600 lg:block">→</div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                          Destination page
                        </p>
                        <p className="mt-2 text-base font-semibold leading-7 tracking-tight text-slate-950 dark:text-slate-50">
                          {opportunity.targetTitle}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-300">
                          {opportunity.targetUrl}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[22px] bg-sky-50/90 px-4 py-4 dark:bg-slate-700">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80 dark:text-sky-200">
                        Anchor opportunity
                      </p>
                      {opportunity.suggestedAnchor ? (<p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                          {opportunity.suggestedAnchor}
                        </p>) : (<p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                          No strong anchor found. Suggested rewrite available.
                        </p>)}
                    </div>

                    <div className="mt-4 rounded-[22px] bg-slate-50/90 px-4 py-5 text-sm leading-7 text-slate-700 transition-colors duration-300 dark:bg-slate-800 dark:text-slate-200">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                        Anchor context
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300/95">
                        {highlightAnchor(opportunity.matchedSnippet, opportunity.suggestedAnchor)}
                      </p>
                      {!opportunity.suggestedAnchor && opportunity.rewriteSuggestion ? (<p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                          {opportunity.rewriteSuggestion}
                        </p>) : null}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-[22px] bg-slate-50/70 px-4 py-5 text-sm leading-7 text-slate-700 transition-colors duration-300 dark:bg-slate-700 dark:text-slate-200">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                          Why this link helps
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300/95">
                          {opportunity.reason}
                        </p>
                      </div>

                      <div className="rounded-[22px] bg-slate-50/70 px-4 py-5 text-sm leading-7 text-slate-700 transition-colors duration-300 dark:bg-slate-700 dark:text-slate-200">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                          Best placement
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300/95">
                          Place the link where this sentence appears: "{opportunity.matchedSnippet}"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 xl:w-[13rem]">
                    <copy_button_1.CopyButton value={buildCopySuggestion(opportunity)}/>
                    <button type="button" onClick={() => {
                    const nextCompleted = !isCompleted;
                    onToggleOpportunity(opportunity, nextCompleted);
                    setFeedbackMessage(nextCompleted
                        ? "Suggestion marked complete and added to your completed count."
                        : "Suggestion moved back to open actions.");
                    window.setTimeout(() => setFeedbackMessage(null), 2200);
                }} className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${isCompleted
                    ? "border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700"
                    : "border border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"}`}>
                      {isCompleted ? "Mark as open" : "Use this anchor"}
                    </button>
                  </div>
                </div>
              </article>);
        })) : (<internal_linking_empty_state_1.InternalLinkingEmptyState hasActiveFilters={false}/>)}
      </div>
    </section>);
}
