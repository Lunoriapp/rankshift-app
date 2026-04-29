"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixList = FixList;
const internal_linking_opportunities_1 = require("@/components/internal-linking-opportunities");
const missing_alt_image_list_1 = require("@/components/missing-alt-image-list");
function formatPillarLabel(pillar) {
    if (pillar === "internalLinking") {
        return "Internal Linking";
    }
    return pillar.charAt(0).toUpperCase() + pillar.slice(1);
}
function bySeverity(fixes) {
    return [
        {
            label: "Critical",
            items: fixes.filter((fix) => fix.severity === "critical"),
            accent: "border-transparent bg-red-50/60 dark:border-transparent dark:bg-slate-800",
        },
        {
            label: "High",
            items: fixes.filter((fix) => fix.severity === "high"),
            accent: "border-transparent bg-slate-50 dark:border-transparent dark:bg-slate-800",
        },
        {
            label: "Medium",
            items: fixes.filter((fix) => fix.severity === "medium"),
            accent: "border-transparent bg-slate-50 dark:border-transparent dark:bg-slate-800",
        },
    ];
}
function emptyState(label) {
    if (label === "Critical") {
        return "No critical blockers are limiting visibility right now. Move into the next fixes to strengthen ranking signals and page clarity.";
    }
    if (label === "High") {
        return "No high-impact fixes are sitting in this priority band. The strongest remaining gains are now more targeted.";
    }
    return "No medium-priority fixes are left in this group. The remaining work is more about maintaining quality than recovering lost visibility.";
}
function FixList({ fixes, images, internalLinkOpportunities, completedFixIds, onToggleFix, onToggleOpportunity, feedbackMessage, }) {
    const missingAltImages = images.filter((image) => image.isMissingAlt);
    const grouped = bySeverity(fixes);
    const completedCount = completedFixIds.length;
    const totalRecommendationCount = fixes.length + internalLinkOpportunities.length;
    const progressPercent = totalRecommendationCount > 0
        ? Math.round((completedCount / totalRecommendationCount) * 100)
        : 0;
    return (<section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_22px_45px_-36px_rgba(15,23,42,0.45)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_22px_45px_-36px_rgba(2,6,23,0.85)] sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
            Step 3 of 7: Fixes
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
            Fix these next to recover visibility and move the score upward
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-200">
            This is the main work area. Each fix shows what is wrong, why it limits visibility or click-through, and what to do next so the user never has to guess.
          </p>
        </div>
        <div className="min-w-[14rem] rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-4 py-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
              Completion status
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{progressPercent}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#047857_0%,#10b981_100%)] transition-all duration-500" style={{ width: `${progressPercent}%` }}/>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-200">
            {completedCount} of {totalRecommendationCount} actions completed
          </p>
        </div>
      </div>

      {feedbackMessage ? (<div className="mt-6 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-900 shadow-sm transition-all">
          <span className="font-semibold">Nice.</span> {feedbackMessage}
        </div>) : null}

      <div className="mt-8 space-y-6">
        {grouped.map(({ label, items, accent }) => (<div key={label}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {label}
            </h3>

            {items.length > 0 ? (<ul className="mt-4 space-y-4">
                {items.map((fix) => {
                    const isCompleted = completedFixIds.includes(fix.id);
                    return (<li key={fix.id} className={`rounded-[1.55rem] border px-5 py-5 transition-all duration-300 ${accent} ${isCompleted ? "border-emerald-200 bg-emerald-50/80 shadow-[0_16px_35px_-26px_rgba(16,185,129,0.55)] dark:border-emerald-800 dark:bg-slate-800" : ""}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-4xl space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-slate-950 dark:text-slate-50">{fix.title}</p>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              {formatPillarLabel(fix.pillar)}
                            </span>
                            {isCompleted ? (<span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                                Completed
                              </span>) : null}
                          </div>
                          <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">What is wrong:</span> {fix.issue}
                          </p>
                          <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">Why it matters:</span> {fix.whyItMatters}
                          </p>
                          <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">What to do:</span> {fix.action}
                          </p>
                          {fix.id === "image-alt" ? (<missing_alt_image_list_1.MissingAltImageList images={missingAltImages}/>) : null}
                        </div>
                        <button type="button" onClick={() => onToggleFix(fix, !isCompleted)} className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${isCompleted
                            ? "border border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm"
                            : "border border-slate-200 bg-slate-100 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"}`}>
                          {isCompleted ? "Completed and tracked" : "Mark completed"}
                        </button>
                      </div>
                    </li>);
                })}
              </ul>) : (<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {emptyState(label)}
              </div>)}
          </div>))}

        <internal_linking_opportunities_1.InternalLinkingOpportunities opportunities={internalLinkOpportunities} completedOpportunityIds={completedFixIds} onToggleOpportunity={onToggleOpportunity}/>
      </div>
    </section>);
}
