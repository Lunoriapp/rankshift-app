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
      <mark className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">{snippet.slice(index, index + anchor.length)}</mark>
      {snippet.slice(index + anchor.length)}
    </>
  );
}

function scoreStatus(score: number): { label: string; className: string } {
  if (score >= 80) {
    return { label: "Good", className: "text-emerald-600" };
  }

  if (score >= 60) {
    return { label: "Needs work", className: "text-amber-600" };
  }

  return { label: "Needs attention", className: "text-rose-600" };
}

function issuesStatus(issueCount: number): { label: string; className: string } {
  if (issueCount === 0) {
    return { label: "All clear", className: "text-emerald-600" };
  }

  if (issueCount <= 2) {
    return { label: "Needs attention", className: "text-amber-600" };
  }

  return { label: "High priority", className: "text-rose-600" };
}

function gradientRing(readinessScore: number): string {
  const clamped = Math.max(0, Math.min(100, readinessScore));
  return `conic-gradient(rgb(79 70 229) ${clamped}%, rgb(226 232 240) 0)`;
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
    const aiPillar = payload.audit.score.pillars.aiVisibility;
    const aiReadiness = aiPillar
      ? Math.round((aiPillar.score / Math.max(1, aiPillar.maxScore)) * 100)
      : 0;
    const aiChecks = aiPillar?.checks ?? [];
    const aiIssues = aiChecks.filter((check) => !check.passed);
    const aiFixes = payload.audit.fixes.filter((fix) => fix.pillar === "aiVisibility");

    return {
      score,
      issueCount: payload.audit.fixes.length,
      primaryFix,
      linkOps,
      conciseFixes: payload.audit.fixes.slice(0, 8),
      aiReadiness,
      aiIssues,
      aiFixes,
    };
  }, [payload]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          Loading audit results...
        </div>
      </main>
    );
  }

  if (error || !payload || !reportSummary) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
          {error ?? "Unable to load report."}
        </div>
      </main>
    );
  }

  const scoreMeta = scoreStatus(reportSummary.score);
  const issuesMeta = issuesStatus(reportSummary.issueCount);
  const aiMeta = scoreStatus(reportSummary.aiReadiness);

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)]">
        <header className="border-b border-slate-100 px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-[2.1rem] font-semibold tracking-tight text-slate-950">
                Rankshift
              </Link>
              <nav className="hidden items-center gap-2 md:flex" aria-label="Product navigation">
                <Link
                  href="/reports"
                  aria-current="page"
                  className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"
                >
                  Audits
                </Link>
                <span className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400" aria-disabled="true">
                  Reports
                </span>
                <span className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400" aria-disabled="true">
                  Projects
                </span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
              >
                + New Audit
              </Link>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                RS
              </span>
            </div>
          </div>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href="/reports" className="text-slate-600 transition hover:text-slate-900">
              &larr; Back to audits
            </Link>
            <div className="flex items-center gap-2 text-slate-500">
              <button type="button" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">Download PDF</button>
              <button type="button" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">Share</button>
              <button type="button" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">Copy link</button>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Audit results</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Your page action plan
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  A high-level summary of your page&apos;s health and opportunities.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">URL analysed</p>
                  <p className="mt-2 break-all text-sm font-medium text-slate-800">{payload.audit.url}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Score</p>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="text-4xl font-semibold tracking-tight text-slate-950">{reportSummary.score}</p>
                    <p className={`pb-1 text-sm font-semibold ${scoreMeta.className}`}>{scoreMeta.label}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Issues found</p>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="text-4xl font-semibold tracking-tight text-slate-950">{reportSummary.issueCount}</p>
                    <p className={`pb-1 text-sm font-semibold ${issuesMeta.className}`}>{issuesMeta.label}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-700 ring-1 ring-indigo-200">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 7.5v5M12 15.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Priority action</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {reportSummary.primaryFix?.title ?? "No critical issues detected"}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {reportSummary.primaryFix?.whyItMatters ??
                      "This page is in strong condition. Focus on iterative content improvements and internal link support."}
                  </p>
                </div>
              </div>
              <Link
                href="#issues-fixes"
                className="inline-flex items-center justify-center rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                View issue &rarr;
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                    <path d="M12 3.5v17M3.5 12h17M5.7 5.7l12.6 12.6M18.3 5.7 5.7 18.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">AI &amp; LLM visibility</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">How ready this page is for AI summaries</h2>
                </div>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                  <path d="m12 4 1.8 4.2 4.2 1.8-4.2 1.8L12 16l-1.8-4.2L6 10l4.2-1.8L12 4Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid h-28 w-28 place-items-center rounded-full p-1" style={{ background: gradientRing(reportSummary.aiReadiness) }}>
                  <div className="grid h-full w-full place-items-center rounded-full bg-white">
                    <p className="text-center text-sm font-medium text-slate-600">
                      <span className="block text-4xl font-semibold tracking-tight text-slate-950">{reportSummary.aiReadiness}</span>
                      / 100
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Readiness score</p>
                  <p className={`mt-1 text-sm font-semibold ${aiMeta.className}`}>{aiMeta.label}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Issues detected</p>
                  {reportSummary.aiIssues.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {reportSummary.aiIssues.map((issue) => (
                        <li key={issue.label}>{issue.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">No AI visibility blockers detected in this audit.</p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Recommended fixes</p>
                  {reportSummary.aiFixes.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {reportSummary.aiFixes.slice(0, 6).map((fix) => (
                        <li key={fix.id}>{fix.action}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">Continue improving topical depth and internal links.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                    <path d="M9 12a3.5 3.5 0 0 1 0-5l2.5-2.5a3.5 3.5 0 0 1 5 5L15 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M15 12a3.5 3.5 0 0 1 0 5l-2.5 2.5a3.5 3.5 0 1 1-5-5L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Internal linking</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Best internal links to add next</h2>
                </div>
              </div>
              <Link
                href={`/report/${reportId}/details`}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                View all opportunities &rarr;
              </Link>
            </div>

            {reportSummary.linkOps.length > 0 ? (
              <div className="mt-5 grid gap-4">
                {reportSummary.linkOps.map((opportunity: InternalLinkOpportunity) => (
                  <article key={opportunity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Source page</p>
                        <p className="mt-1 text-sm text-slate-800">{opportunity.sourceTitle}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Anchor phrase</p>
                        <p className="mt-1 inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-sm font-semibold text-indigo-700">
                          {opportunity.suggestedAnchor}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Target page</p>
                        <p className="mt-1 text-sm text-slate-800">{opportunity.targetTitle}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      <span className="font-semibold text-slate-900">Context:</span>{" "}
                      {highlightAnchor(opportunity.matchedSnippet, opportunity.suggestedAnchor)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      <span className="font-semibold text-slate-900">Why this works:</span> {opportunity.reason}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                No strong contextual links were found in this scan. Add one contextual link from related pages and rerun the audit.
              </p>
            )}
          </section>

          <section id="issues-fixes" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                  <path d="M6 19 18 7M10 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 7h3M6 7v3M18 19h-3M18 19v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Issues &amp; fixes</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">What to fix now</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {reportSummary.conciseFixes.map((fix) => (
                <article key={fix.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2 md:items-start">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{fix.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{fix.issue}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Suggested fix</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{fix.action}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="m8.5 9.5 2 2 4.5-4.5M8.5 14.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Next steps</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Simple execution checklist</h2>
                  </div>
                </div>
                <ol className="mt-4 space-y-2 text-sm text-slate-700">
                  <li>1. Implement the priority action first.</li>
                  <li>2. Add the top internal link opportunities from this report.</li>
                  <li>3. Complete at least three high-impact fixes this week.</li>
                  <li>4. Rerun the audit and compare your score trend.</li>
                </ol>
              </div>
              <div className="hidden items-center justify-center rounded-xl border border-slate-200 bg-slate-50 md:flex">
                <svg viewBox="0 0 180 120" className="h-24 w-36 text-indigo-500" fill="none" aria-hidden="true">
                  <rect x="46" y="16" width="88" height="96" rx="10" stroke="currentColor" strokeWidth="3" />
                  <rect x="61" y="34" width="55" height="8" rx="4" fill="currentColor" opacity="0.3" />
                  <path d="m61 58 8 8 12-12M61 78 69 86l12-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M86 61h31M86 81h31" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-200 bg-[#f1f0ff] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-700 ring-1 ring-indigo-200">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                    <path d="m12 4 2.2 4.9 4.9 2.2-4.9 2.2L12 18l-2.2-4.7L4.9 11l4.9-2.2L12 4Z" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    Run another audit after updates
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Re-scan the page after changes, or unlock deeper recommendations.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  Run another audit
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

