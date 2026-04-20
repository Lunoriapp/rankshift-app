"use client";

import { useMemo, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { InternalLinkingEmptyState } from "@/components/internal-linking-empty-state";
import type { InternalLinkConfidence, InternalLinkOpportunity } from "@/lib/internalLinking/types";

interface InternalLinkingOpportunitiesProps {
  opportunities: InternalLinkOpportunity[];
  completedOpportunityIds: string[];
  onToggleOpportunity: (opportunity: InternalLinkOpportunity, completed: boolean) => void;
}

function confidenceTone(confidence: InternalLinkConfidence): string {
  if (confidence === "High") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-slate-700 dark:text-sky-300";
  }

  if (confidence === "Medium") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-slate-700 dark:text-sky-300";
  }

  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200";
}

function statusTone(isCompleted: boolean): string {
  return isCompleted
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function formatDomain(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function shortenReason(reason: string): string {
  const clean = reason.replace(/\s+/g, " ").trim();

  if (clean.length <= 150) {
    return clean;
  }

  const shortened = clean.slice(0, 147).trim();
  return `${shortened}...`;
}

function buildCopySuggestion(opportunity: InternalLinkOpportunity): string {
  return [
    `Source page: ${opportunity.sourceTitle}`,
    `Source URL: ${opportunity.sourceUrl}`,
    `Target page: ${opportunity.targetTitle}`,
    `Target URL: ${opportunity.targetUrl}`,
    `Suggested anchor: ${opportunity.suggestedAnchor}`,
    `Matched snippet: ${opportunity.matchedSnippet}`,
    `Placement hint: ${opportunity.placementHint}`,
    `Reason: ${opportunity.reason}`,
    ...(opportunity.otherPossibleMatches?.length
      ? [
          `Other possible matches: ${opportunity.otherPossibleMatches
            .map((match) => `${match.targetTitle} (${match.targetUrl})`)
            .join(", ")}`,
        ]
      : []),
  ].join("\n");
}

function highlightAnchor(snippet: string, anchor: string) {
  const lowerSnippet = snippet.toLowerCase();
  const lowerAnchor = anchor.toLowerCase();
  const matchIndex = lowerSnippet.indexOf(lowerAnchor);

  if (matchIndex === -1) {
    return <span>{snippet}</span>;
  }

  const before = snippet.slice(0, matchIndex);
  const match = snippet.slice(matchIndex, matchIndex + anchor.length);
  const after = snippet.slice(matchIndex + anchor.length);

  return (
    <span>
      {before}
        <mark className="rounded-md bg-amber-100 px-1.5 py-0.5 font-medium text-slate-950 dark:bg-amber-950/70 dark:text-amber-100">
        {match}
      </mark>
      {after}
    </span>
  );
}

function renderLinkedSnippetPreview(opportunity: InternalLinkOpportunity) {
  const snippet = opportunity.matchedSnippet;
  const anchor = opportunity.suggestedAnchor;
  const lowerSnippet = snippet.toLowerCase();
  const lowerAnchor = anchor.toLowerCase();
  const matchIndex = lowerSnippet.indexOf(lowerAnchor);

  if (matchIndex === -1) {
    return <span>{snippet}</span>;
  }

  const before = snippet.slice(0, matchIndex);
  const match = snippet.slice(matchIndex, matchIndex + anchor.length);
  const after = snippet.slice(matchIndex + anchor.length);

  return (
    <span>
      {before}
      <a
        href={opportunity.targetUrl}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-800 dark:text-sky-300 dark:decoration-sky-600 dark:hover:text-sky-200"
      >
        {match}
      </a>
      {after}
    </span>
  );
}

export function InternalLinkingOpportunities({
  opportunities,
  completedOpportunityIds,
  onToggleOpportunity,
}: InternalLinkingOpportunitiesProps) {
  const [confidenceFilter, setConfidenceFilter] = useState<InternalLinkConfidence | "All">("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  const sourceOptions = useMemo(
    () =>
      [...new Set(opportunities.map((opportunity) => opportunity.sourceUrl))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [opportunities],
  );

  const filteredOpportunities = useMemo(
    () =>
      opportunities.filter((opportunity) => {
        const matchesConfidence =
          confidenceFilter === "All" || opportunity.confidence === confidenceFilter;
        const matchesSource = sourceFilter === "All" || opportunity.sourceUrl === sourceFilter;
        const matchesIncomplete =
          !showIncompleteOnly || !completedOpportunityIds.includes(opportunity.id);

        return matchesConfidence && matchesSource && matchesIncomplete;
      }),
    [completedOpportunityIds, confidenceFilter, opportunities, showIncompleteOnly, sourceFilter],
  );

  const completedCount = opportunities.filter((opportunity) =>
    completedOpportunityIds.includes(opportunity.id),
  ).length;
  const openCount = opportunities.length - completedCount;
  const hasActiveFilters =
    confidenceFilter !== "All" || sourceFilter !== "All" || showIncompleteOnly;

  return (
    <section className="rounded-[32px] border border-white/60 bg-white/82 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_20px_60px_rgba(2,6,23,0.7)] sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-300">
            Internal linking
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            Add these contextual links next
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Each item shows the source page to edit, the destination page to link to, the anchor
            to use, and the best place to drop it into the copy.
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

      {opportunities.length > 0 ? (
        <>
          <div className="mt-6 grid gap-3 lg:grid-cols-[0.8fr_1.2fr_0.8fr]">
            <label className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                Confidence
              </span>
              <select
                value={confidenceFilter}
                onChange={(event) =>
                  setConfidenceFilter(event.target.value as InternalLinkConfidence | "All")
                }
                className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
              >
                <option value="All">All confidence levels</option>
                <option value="High">High confidence</option>
                <option value="Medium">Medium confidence</option>
                <option value="Low">Low confidence</option>
              </select>
            </label>

            <label className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                Source page
              </span>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
              >
                <option value="All">All source pages</option>
                {sourceOptions.map((sourceUrl) => (
                  <option key={sourceUrl} value={sourceUrl}>
                    {sourceUrl}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                checked={showIncompleteOnly}
                onChange={(event) => setShowIncompleteOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-sky-400"
              />
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                  Queue view
                </span>
                <span className="mt-1 block text-sm text-slate-900 dark:text-slate-100">Show only open actions</span>
              </span>
            </label>
          </div>

          <div className="mt-6 space-y-3">
            {filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((opportunity) => {
                const isCompleted = completedOpportunityIds.includes(opportunity.id);

                return (
                  <article
                    key={opportunity.id}
                    className={`rounded-[28px] border px-5 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all ${
                      isCompleted
                        ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-slate-800"
                        : "border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:bg-slate-700/80 dark:text-slate-200">
                            Internal link task
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${confidenceTone(opportunity.confidence)}`}
                          >
                            {opportunity.confidence}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(isCompleted)}`}
                          >
                            {isCompleted ? "Completed" : "Open"}
                          </span>
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-800 dark:border-sky-700 dark:bg-slate-700 dark:text-sky-200">
                            {opportunity.placementHint}
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
                              Target page
                            </p>
                            <p className="mt-2 text-base font-semibold leading-7 tracking-tight text-slate-950 dark:text-slate-50">
                              {opportunity.targetTitle}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-300">
                              {formatDomain(opportunity.targetUrl)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-[22px] bg-sky-50/90 px-4 py-4 dark:bg-slate-700">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700/80 dark:text-sky-200">
                            Suggested anchor text
                          </p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                            {opportunity.suggestedAnchor}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                          <div className="rounded-[22px] bg-slate-50/90 px-4 py-5 text-sm leading-7 text-slate-700 transition-colors duration-300 dark:bg-slate-800 dark:text-slate-200">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                              Matched snippet
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300/95">
                              {highlightAnchor(
                                opportunity.matchedSnippet,
                                opportunity.suggestedAnchor,
                              )}
                            </p>
                          </div>

                          <div className="rounded-[22px] bg-slate-50/70 px-4 py-5 text-sm leading-7 text-slate-700 transition-colors duration-300 dark:bg-slate-700 dark:text-slate-200">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                              Source copy preview
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300/95">
                              {renderLinkedSnippetPreview(opportunity)}
                            </p>
                            <a
                              href={opportunity.targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 block truncate text-sm font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-800 dark:text-sky-300 dark:decoration-sky-600 dark:hover:text-sky-200"
                            >
                              {opportunity.targetUrl}
                            </a>
                          </div>
                        </div>

                        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">Why it matters:</span>{" "}
                          {shortenReason(opportunity.reason)}
                        </p>

                        {opportunity.otherPossibleMatches?.length ? (
                          <details className="mt-4 rounded-[20px] bg-slate-50/70 px-4 py-3 transition-colors duration-300 dark:bg-slate-800">
                            <summary className="cursor-pointer list-none text-sm font-medium text-slate-700 dark:text-slate-300">
                              Other possible matches ({opportunity.otherPossibleMatches.length})
                            </summary>
                            <div className="mt-3 space-y-2">
                              {opportunity.otherPossibleMatches.map((match) => (
                                <div
                                  key={`${opportunity.id}-${match.targetUrl}`}
                                  className="flex flex-col gap-2 rounded-2xl bg-slate-50/90 px-3 py-4 transition-colors duration-300 dark:bg-slate-700 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {match.targetTitle}
                                    </p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                                      {match.targetUrl}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-slate-800 dark:text-amber-200">
                                      {match.suggestedAnchor}
                                    </span>
                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${confidenceTone(match.confidence)}`}
                                    >
                                      {match.confidence}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col gap-3 xl:w-[13rem]">
                        <CopyButton value={buildCopySuggestion(opportunity)} />
                        <button
                          type="button"
                          onClick={() => onToggleOpportunity(opportunity, !isCompleted)}
                          className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                            isCompleted
                              ? "border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700"
                              : "border border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                          }`}
                        >
                          {isCompleted ? "Mark as open" : "Mark completed"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <InternalLinkingEmptyState hasActiveFilters={hasActiveFilters} />
            )}
          </div>
        </>
      ) : (
        <div className="mt-6">
          <InternalLinkingEmptyState hasActiveFilters={false} />
        </div>
      )}
    </section>
  );
}
