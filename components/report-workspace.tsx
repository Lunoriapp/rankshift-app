"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { AuditFix } from "@/lib/audit-fixes";
import type { InternalLinkOpportunity } from "@/lib/internalLinking/types";
import type {
  AuditFixStateRecord,
  AuditHistoryEntry,
  AuditRecord,
  CompetitorSnapshotRecord,
} from "@/lib/supabase";
import { getSupabaseAccessToken } from "@/lib/supabase-browser";

interface ReportWorkspaceProps {
  reportId: string;
}

interface ReportPayload {
  audit: AuditRecord;
  history: AuditHistoryEntry[];
  fixStates: AuditFixStateRecord[];
  competitorSnapshots: CompetitorSnapshotRecord[];
}

function normalizeOpportunityUrl(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return value;
  }
}

function normalizeComparablePageKey(value: string): string {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = (parsed.pathname.replace(/\/+$/, "") || "/").toLowerCase();
    return `${hostname}${pathname}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

function getPrimaryFix(fixes: AuditFix[]): AuditFix | null {
  if (fixes.length === 0) {
    return null;
  }

  const severityRank = {
    critical: 0,
    high: 1,
    medium: 2,
  } as const;

  return [...fixes].sort((a, b) => severityRank[a.severity] - severityRank[b.severity])[0] ?? null;
}

function highlightAnchor(snippet: string, anchor: string) {
  const lowerSnippet = snippet.toLowerCase();
  const lowerAnchor = anchor.toLowerCase();
  const index = lowerSnippet.indexOf(lowerAnchor);

  if (index < 0) {
    return snippet;
  }

  return (
    <>
      {snippet.slice(0, index)}
      <mark className="rounded bg-indigo-100 px-1 text-indigo-800">{snippet.slice(index, index + anchor.length)}</mark>
      {snippet.slice(index + anchor.length)}
    </>
  );
}

function shortInsight(score: number, issueCount: number): string {
  if (score >= 80 && issueCount <= 3) {
    return "Strong page health with a few quick wins to protect rankings.";
  }

  if (score >= 60) {
    return "Solid foundation. Fix priority issues to unlock faster gains.";
  }

  return "High-impact fixes are needed now to improve visibility and performance.";
}

export function ReportWorkspace({ reportId }: ReportWorkspaceProps) {
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const accessToken = await getSupabaseAccessToken();
        const response = await fetch(`/api/reports/${reportId}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const nextPayload = (await response.json()) as
          | (ReportPayload & { error?: string })
          | { error?: string };

        if (!response.ok || !("audit" in nextPayload)) {
          throw new Error(nextPayload.error ?? "Unable to load report.");
        }

        setPayload(nextPayload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load report.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [reportId]);

  const reportSummary = useMemo(() => {
    if (!payload) {
      return null;
    }

    const score = payload.audit.score_value ?? payload.audit.score.total;
    const allLinkOps = payload.audit.crawl.internalLinking?.opportunities ?? [];
    const auditedPageKey = normalizeComparablePageKey(payload.audit.url);
    const sourceMatched = allLinkOps.filter(
      (opportunity) =>
        normalizeComparablePageKey(opportunity.sourceUrl) === auditedPageKey ||
        normalizeOpportunityUrl(opportunity.sourceUrl) === normalizeOpportunityUrl(payload.audit.url),
    );
    const linkOps = (sourceMatched.length > 0 ? sourceMatched : allLinkOps).slice(0, 3);
    const primaryFix = getPrimaryFix(payload.audit.fixes);

    return {
      score,
      issueCount: payload.audit.fixes.length,
      insight: shortInsight(score, payload.audit.fixes.length),
      primaryFix,
      linkOps,
      conciseFixes: payload.audit.fixes.slice(0, 8),
    };
  }, [payload]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1100px] rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          Loading audit results...
        </div>
      </main>
    );
  }

  if (error || !payload || !reportSummary) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1100px] rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
          {error ?? "Unable to load report."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Audit results</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your page action plan</h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">URL analysed</p>
              <p className="mt-2 break-all text-sm font-medium text-slate-800">{payload.audit.url}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{reportSummary.score}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issues found</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{reportSummary.issueCount}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">{reportSummary.insight}</p>
        </section>

        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Priority action</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {reportSummary.primaryFix?.title ?? "No critical issues detected"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {reportSummary.primaryFix?.whyItMatters ??
              "This page is in strong condition. Focus on iterative content improvements and internal link support."}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Internal linking</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Best internal links to add next</h2>
          {reportSummary.linkOps.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {reportSummary.linkOps.map((opportunity: InternalLinkOpportunity) => (
                <article key={opportunity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source page</p>
                      <p className="mt-1 text-sm text-slate-800">{opportunity.sourceTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Anchor phrase</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{opportunity.suggestedAnchor}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target page</p>
                      <p className="mt-1 text-sm text-slate-800">{opportunity.targetTitle}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">
                    Context: {highlightAnchor(opportunity.matchedSnippet, opportunity.suggestedAnchor)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Why this works: {opportunity.reason}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              No strong contextual links were found in this scan. Add one contextual link from related pages and rerun the audit.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Issues and fixes</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">What to fix now</h2>
          <div className="mt-5 space-y-3">
            {reportSummary.conciseFixes.map((fix) => (
              <article key={fix.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-base font-semibold text-slate-950">{fix.title}</p>
                <p className="mt-1 text-sm text-slate-600">{fix.issue}</p>
                <p className="mt-2 text-sm font-medium text-slate-800">Suggested fix: {fix.action}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Next steps</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Simple execution checklist</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>1. Implement the priority action first.</li>
            <li>2. Add the top internal link opportunities from this report.</li>
            <li>3. Complete at least three high-impact fixes this week.</li>
            <li>4. Rerun the audit and compare your score trend.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-indigo-200 bg-[#f1f0ff] p-6 text-center sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Keep improving this page
          </h2>
          <p className="mt-2 text-sm text-slate-600">Run another audit after updates, or unlock deeper recommendations.</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Run another audit
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Upgrade
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
