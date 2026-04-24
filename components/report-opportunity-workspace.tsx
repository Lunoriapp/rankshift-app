"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ImageAltOpportunityCards } from "@/components/image-alt-opportunity-cards";
import { InternalLinkOpportunityCards } from "@/components/internal-link-opportunity-cards";
import type { AuditFixStateRecord, AuditHistoryEntry, AuditRecord, CompetitorSnapshotRecord } from "@/lib/supabase";
import { getSupabaseAccessToken } from "@/lib/supabase-browser";

interface ReportOpportunityWorkspaceProps {
  reportId: string;
  mode: "internal-links" | "images";
}

interface ReportPayload {
  audit: AuditRecord;
  history: AuditHistoryEntry[];
  fixStates: AuditFixStateRecord[];
  competitorSnapshots: CompetitorSnapshotRecord[];
}

export function ReportOpportunityWorkspace({ reportId, mode }: ReportOpportunityWorkspaceProps) {
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

  const imageSummary = useMemo(() => {
    if (!payload) {
      return null;
    }

    const images = payload.audit.crawl.images ?? [];
    const altCounts = new Map<string, number>();

    for (const image of images) {
      const alt = image.alt.trim().toLowerCase();
      if (!alt) {
        continue;
      }
      altCounts.set(alt, (altCounts.get(alt) ?? 0) + 1);
    }

    let missing = 0;
    let weak = 0;
    let duplicate = 0;
    const weakPatterns = /^(image|photo|picture|graphic|logo|banner|img)$/i;

    for (const image of images) {
      const alt = image.alt.trim();
      if (!alt) {
        missing += 1;
        continue;
      }
      const normalized = alt.toLowerCase();
      if ((altCounts.get(normalized) ?? 0) > 1) {
        duplicate += 1;
        continue;
      }
      if (alt.length < 5 || weakPatterns.test(alt)) {
        weak += 1;
      }
    }

    return { missing, weak, duplicate, total: images.length };
  }, [payload]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          Loading opportunities...
        </div>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
          {error ?? "Unable to load opportunities."}
        </div>
      </main>
    );
  }

  const internalOpportunities = payload.audit.crawl.internalLinking?.opportunities ?? [];
  const imageOpportunities = payload.audit.crawl.images ?? [];

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px] rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] sm:p-8">
        <Link href={`/report/${reportId}`} className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-800">
          &larr; Back to report
        </Link>

        {mode === "internal-links" ? (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Internal linking</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">All internal link opportunities</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review every link opportunity and apply anchors where they improve relevance and crawl paths.
            </p>
            <InternalLinkOpportunityCards opportunities={internalOpportunities} />
          </section>
        ) : null}

        {mode === "images" ? (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Image alt text</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">All image alt text fixes</h1>
            <p className="mt-2 text-sm text-slate-600">Review every image that needs clearer alt text.</p>
            {imageSummary ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Missing alt</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{imageSummary.missing}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Weak alt</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{imageSummary.weak}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Duplicate alt</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{imageSummary.duplicate}</p>
                </div>
              </div>
            ) : null}
            <ImageAltOpportunityCards images={imageOpportunities} pageUrl={payload.audit.url} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
