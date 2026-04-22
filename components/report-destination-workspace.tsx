"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { FixList } from "@/components/fix-list";
import { HistoryPanel } from "@/components/history-panel";
import { RewritePanel } from "@/components/rewrite-panel";
import type { AuditFixStateRecord, AuditHistoryEntry, AuditRecord, CompetitorSnapshotRecord } from "@/lib/supabase";
import { getSupabaseAccessToken } from "@/lib/supabase-browser";

interface ReportDestinationWorkspaceProps {
  reportId: string;
  section: "details" | "scoring" | "history" | "insights" | "export";
}

interface ReportPayload {
  audit: AuditRecord;
  history: AuditHistoryEntry[];
  fixStates: AuditFixStateRecord[];
  competitorSnapshots: CompetitorSnapshotRecord[];
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)] dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">{title}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function LockedPreview({
  title,
  preview,
}: {
  title: string;
  preview: string[];
}) {
  return (
    <section className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/40 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800 dark:text-amber-300">🔒 Preview</p>
      <h2 className="mt-2 text-2xl font-semibold text-amber-950 dark:text-amber-100">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-amber-900 dark:text-amber-200">
        {preview.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-6 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
      >
        Upgrade to unlock
      </button>
    </section>
  );
}

export function ReportDestinationWorkspace({ reportId, section }: ReportDestinationWorkspaceProps) {
  const searchParams = useSearchParams();
  const isPaid = searchParams.get("plan") === "paid";
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

  const completedFixIds = useMemo(
    () =>
      payload?.fixStates
        .filter((state) => state.completed)
        .map((state) => state.fix_id) ?? [],
    [payload],
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-slate-950 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Loading...
        </div>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10 dark:bg-slate-950 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error ?? "Unable to load this section."}
        </div>
      </main>
    );
  }

  const rewrites = [
    {
      label: "Title" as const,
      value: payload.audit.ai_output.rewrites.title,
      why: "Use this title to improve click-through and intent alignment.",
      intent: "Ranking and click-through",
      target: "Ideal length: 10-60 characters",
    },
    {
      label: "Meta Description" as const,
      value: payload.audit.ai_output.rewrites.description,
      why: "Use this description to improve search snippet conversion.",
      intent: "Search snippet conversion",
      target: "Ideal length: 50-160 characters",
    },
    {
      label: "H1" as const,
      value: payload.audit.ai_output.rewrites.h1,
      why: "Use this H1 to strengthen page relevance and structure.",
      intent: "On-page relevance and clarity",
      target: "One clear page-defining H1",
    },
  ];

  const headingMap: Array<{ key: string; value: number; max: number }> = [
    { key: "Meta", value: payload.audit.score.pillars.meta.score, max: payload.audit.score.pillars.meta.maxScore },
    { key: "Headings", value: payload.audit.score.pillars.headings.score, max: payload.audit.score.pillars.headings.maxScore },
    { key: "Images", value: payload.audit.score.pillars.images.score, max: payload.audit.score.pillars.images.maxScore },
    { key: "Performance", value: payload.audit.score.pillars.performance.score, max: payload.audit.score.pillars.performance.maxScore },
    { key: "Schema", value: payload.audit.score.pillars.schema.score, max: payload.audit.score.pillars.schema.maxScore },
    { key: "Internal linking", value: payload.audit.score.pillars.internalLinking.score, max: payload.audit.score.pillars.internalLinking.maxScore },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <a href={`/report/${reportId}${isPaid ? "?plan=paid" : ""}`} className="text-sm font-semibold text-sky-700 dark:text-sky-300">← Back to results</a>

        {section === "details" ? (
          <SectionShell title="Full audit details" description="Full implementation view for fixes, internal links, and rewrite suggestions.">
            <FixList
              fixes={payload.audit.fixes}
              images={payload.audit.crawl.images}
              internalLinkOpportunities={payload.audit.crawl.internalLinking?.opportunities ?? []}
              completedFixIds={completedFixIds}
              onToggleFix={() => undefined}
              onToggleOpportunity={() => undefined}
              feedbackMessage={null}
            />
            <div className="mt-6">
              <RewritePanel rewrites={rewrites} />
            </div>
          </SectionShell>
        ) : null}

        {section === "scoring" ? (
          <SectionShell title="Scoring logic" description="See how each scoring category contributes to the page score.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {headingMap.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.key}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{item.value}<span className="text-lg text-slate-400">/{item.max}</span></p>
                </div>
              ))}
            </div>
          </SectionShell>
        ) : null}

        {section === "history" ? (
          isPaid ? (
            <HistoryPanel history={payload.history} onLockedFeature={() => undefined} />
          ) : (
            <LockedPreview
              title="Scan history"
              preview={[
                "Score movement over time",
                "Completed actions",
                "Scan-to-scan comparisons",
              ]}
            />
          )
        ) : null}

        {section === "insights" ? (
          isPaid ? (
            <SectionShell title="Premium insights" description="Competitor-driven strategic opportunities for stronger SEO growth.">
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <p>• Competitor topic gaps</p>
                <p>• Stronger heading suggestions</p>
                <p>• Advanced content opportunities</p>
              </div>
            </SectionShell>
          ) : (
            <LockedPreview
              title="Premium insights"
              preview={[
                "Competitor topic gaps",
                "Stronger heading suggestions",
                "Advanced content opportunities",
              ]}
            />
          )
        ) : null}

        {section === "export" ? (
          isPaid ? (
            <SectionShell title="Export centre" description="Download and share report outputs.">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-sky-500 dark:text-slate-950">Export PDF</button>
                <button type="button" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Export CSV</button>
                <button type="button" className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Share client view</button>
              </div>
            </SectionShell>
          ) : (
            <LockedPreview
              title="Export centre"
              preview={[
                "PDF export",
                "CSV export",
                "Shareable client view",
              ]}
            />
          )
        ) : null}
      </div>
    </main>
  );
}
