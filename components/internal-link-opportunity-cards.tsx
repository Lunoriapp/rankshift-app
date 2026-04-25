"use client";

import { useMemo, useState } from "react";

import type { InternalLinkOpportunity } from "@/lib/internalLinking/types";
import { decodeHtmlEntities } from "@/lib/decode-html-entities";

interface InternalLinkOpportunityCardsProps {
  opportunities: InternalLinkOpportunity[];
  maxItems?: number;
}

function compactUrl(value: string): string {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${host}${path}` || host;
  } catch {
    return value;
  }
}

function highlightAnchor(snippet: string, anchor: string | null) {
  const normalizedSnippet = decodeHtmlEntities(snippet);
  const normalizedAnchor = decodeHtmlEntities(anchor ?? "");

  if (!normalizedAnchor) {
    return normalizedSnippet;
  }
  const lowerSnippet = normalizedSnippet.toLowerCase();
  const lowerAnchor = normalizedAnchor.toLowerCase();
  const index = lowerSnippet.indexOf(lowerAnchor);

  if (index < 0) {
    return normalizedSnippet;
  }

  return (
    <>
      {normalizedSnippet.slice(0, index)}
      <mark className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">
        {normalizedSnippet.slice(index, index + normalizedAnchor.length)}
      </mark>
      {normalizedSnippet.slice(index + normalizedAnchor.length)}
    </>
  );
}

export function InternalLinkOpportunityCards({
  opportunities,
  maxItems,
}: InternalLinkOpportunityCardsProps) {
  const [linkActionFeedback, setLinkActionFeedback] = useState<Record<string, string>>({});
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({});
  const [addedOpportunities, setAddedOpportunities] = useState<Record<string, boolean>>({});
  const [showLowConfidence, setShowLowConfidence] = useState(false);

  const sorted = useMemo(() => {
    const confidenceRank = { High: 3, Medium: 2, Low: 1 } as const;

    return [...opportunities].sort((a, b) => {
      if (confidenceRank[a.confidence] !== confidenceRank[b.confidence]) {
        return confidenceRank[b.confidence] - confidenceRank[a.confidence];
      }

      return b.confidenceScore - a.confidenceScore;
    });
  }, [opportunities]);
  const lowConfidence = sorted.filter((item) => item.confidence === "Low");
  const primary = sorted.filter((item) => item.confidence !== "Low");
  const visiblePool = showLowConfidence ? [...primary, ...lowConfidence] : primary;
  const visible = typeof maxItems === "number" ? visiblePool.slice(0, maxItems) : visiblePool;

  const copyTextToClipboard = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = value;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "absolute";
        temporaryInput.style.left = "-9999px";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(temporaryInput);
        return copied;
      } catch {
        return false;
      }
    }
  };

  const setLinkFeedbackWithReset = (id: string, message: string) => {
    setLinkActionFeedback((previous) => ({ ...previous, [id]: message }));
    window.setTimeout(() => {
      setLinkActionFeedback((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
    }, 1800);
  };

  const handleCopyAnchor = async (id: string, anchor: string | null) => {
    if (!anchor) {
      setLinkFeedbackWithReset(id, "No anchor to copy");
      return;
    }

    const copied = await copyTextToClipboard(decodeHtmlEntities(anchor));
    setLinkFeedbackWithReset(id, copied ? "Anchor copied" : "Copy failed");
  };

  const handleCopyTargetUrl = async (id: string, targetUrl: string) => {
    const copied = await copyTextToClipboard(targetUrl);
    setLinkFeedbackWithReset(id, copied ? "Target URL copied" : "Copy failed");
  };

  const handleMarkLinkAdded = (id: string) => {
    setAddedOpportunities((previous) => ({ ...previous, [id]: true }));
    setLinkFeedbackWithReset(id, "Marked as added");
  };

  return (
    <div className="mt-5 grid gap-4">
      {visible.map((opportunity) => (
        <article key={opportunity.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Link opportunity</p>
            {opportunity.confidence ? (
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                  opportunity.confidence === "High"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : opportunity.confidence === "Medium"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                {opportunity.confidence} confidence
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
            <div className="rounded-lg border border-indigo-200 bg-white px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">1. Link this text</p>
              {opportunity.suggestedAnchor ? (
                <p className="mt-2 inline-flex rounded-full border border-indigo-200 bg-[linear-gradient(135deg,#e0e7ff,#eef2ff)] px-3 py-1.5 text-sm font-semibold text-indigo-700">
                  {decodeHtmlEntities(opportunity.suggestedAnchor)}
                </p>
              ) : (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
                  No strong anchor found. Suggested rewrite available.
                </p>
              )}
            </div>
            <div className="hidden items-center justify-center text-slate-300 lg:flex" aria-hidden="true">
              &rarr;
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">2. Found on this page</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{decodeHtmlEntities(opportunity.sourceTitle)}</p>
              <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">{compactUrl(opportunity.sourceUrl)}</p>
            </div>
            <div className="hidden items-center justify-center text-slate-300 lg:flex" aria-hidden="true">
              &rarr;
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/45 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">3. Link it to this page</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{decodeHtmlEntities(opportunity.targetTitle)}</p>
              <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">{compactUrl(opportunity.targetUrl)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700">
              <span className="font-semibold text-slate-900">Context match:</span>{" "}
              {highlightAnchor(opportunity.matchedSnippet, opportunity.suggestedAnchor)}
            </p>
            {!opportunity.suggestedAnchor && opportunity.rewriteSuggestion ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-6 text-amber-800">
                <span className="font-semibold">Suggested rewrite:</span> {opportunity.rewriteSuggestion}
              </p>
            ) : null}
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-900">Why this works:</span>{" "}
                <span
                  className={
                    expandedReasons[opportunity.id]
                      ? ""
                      : "[display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden"
                  }
                >
                  {decodeHtmlEntities(opportunity.reason)}
                </span>
              </p>
              {opportunity.reason.length > 140 ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedReasons((previous) => ({
                      ...previous,
                      [opportunity.id]: !previous[opportunity.id],
                    }))
                  }
                  className="mt-1 text-xs font-semibold text-indigo-700 transition hover:text-indigo-800"
                >
                  {expandedReasons[opportunity.id] ? "Show less" : "Show more"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {opportunity.suggestedAnchor ? (
              <button
                type="button"
                onClick={() => void handleCopyAnchor(opportunity.id, opportunity.suggestedAnchor)}
                className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Copy anchor
              </button>
            ) : opportunity.rewriteSuggestion ? (
              <button
                type="button"
                onClick={() => void handleCopyAnchor(opportunity.id, opportunity.rewriteSuggestion ?? null)}
                className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Copy rewrite
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleCopyTargetUrl(opportunity.id, opportunity.targetUrl)}
              className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Copy target URL
            </button>
            <button
              type="button"
              onClick={() => handleMarkLinkAdded(opportunity.id)}
              disabled={addedOpportunities[opportunity.id]}
              className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {addedOpportunities[opportunity.id] ? "Marked as added" : "Mark as added"}
            </button>
            {linkActionFeedback[opportunity.id] ? (
              <p className="text-xs font-semibold text-slate-600">{linkActionFeedback[opportunity.id]}</p>
            ) : null}
          </div>
        </article>
      ))}
      {lowConfidence.length > 0 && typeof maxItems !== "number" ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowLowConfidence((current) => !current)}
            className="text-xs font-semibold text-slate-600 transition hover:text-slate-800"
          >
            {showLowConfidence
              ? "Hide low confidence suggestions"
              : `Show low confidence suggestions (${lowConfidence.length})`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
