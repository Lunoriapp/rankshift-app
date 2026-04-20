"use client";

import { useEffect, useMemo, useState } from "react";

import { InternalLinkingOpportunities } from "@/components/internal-linking-opportunities";
import { getSupabaseAccessToken } from "@/lib/supabase-browser";
import type { InternalLinkOpportunity } from "@/lib/internalLinking/types";
import { mockInternalLinkingOpportunities } from "@/lib/mock-internal-linking";

interface InternalLinkingOpportunitiesClientProps {
  workspaceId?: string;
  pageId?: string;
  auditId?: string;
}

export function InternalLinkingOpportunitiesClient({
  workspaceId,
  pageId,
  auditId,
}: InternalLinkingOpportunitiesClientProps) {
  const shouldUseDatabase = Boolean(workspaceId && pageId);
  const [opportunities, setOpportunities] = useState<InternalLinkOpportunity[]>(() =>
    shouldUseDatabase ? [] : mockInternalLinkingOpportunities,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(shouldUseDatabase);

  useEffect(() => {
    if (!shouldUseDatabase || !workspaceId || !pageId) {
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const accessToken = await getSupabaseAccessToken();
        const query = auditId ? `?auditId=${encodeURIComponent(auditId)}` : "";
        const response = await fetch(
          `/api/workspaces/${workspaceId}/pages/${pageId}/internal-link-opportunities${query}`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          },
        );
        const payload = (await response.json()) as
          | { opportunities?: InternalLinkOpportunity[]; error?: string }
          | null;

        if (!response.ok || !payload?.opportunities) {
          throw new Error(payload?.error ?? "Unable to load internal link opportunities.");
        }

        setOpportunities(payload.opportunities);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load internal link opportunities.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [auditId, pageId, shouldUseDatabase, workspaceId]);

  const completedOpportunityIds = useMemo(
    () =>
      opportunities
        .filter((opportunity) => opportunity.status === "completed")
        .map((opportunity) => opportunity.id),
    [opportunities],
  );

  async function handleToggleOpportunity(
    opportunity: InternalLinkOpportunity,
    completed: boolean,
  ) {
    if (!shouldUseDatabase) {
      setOpportunities((current) =>
        current.map((item) =>
          item.id === opportunity.id
            ? { ...item, status: completed ? "completed" : "open" }
            : item,
        ),
      );
      return;
    }

    try {
      const row = opportunities.find((item) => item.id === opportunity.id);

      if (!row) {
        return;
      }

      const accessToken = await getSupabaseAccessToken();
      const response = await fetch(`/api/internal-link-opportunities/${row.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ completed, pageId, auditId }),
      });
      const payload = (await response.json()) as
        | { opportunity?: InternalLinkOpportunity; error?: string }
        | null;

      if (!response.ok || !payload?.opportunity) {
        throw new Error(payload?.error ?? "Unable to update internal link opportunity.");
      }

      setOpportunities((current) =>
        current.map((item) =>
          item.id === opportunity.id ? payload.opportunity! : item,
        ),
      );
      setError(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update internal link opportunity.",
      );
    }
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white/85 px-5 py-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          Loading internal linking opportunities...
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          {error}
        </div>
      ) : null}
      <InternalLinkingOpportunities
        opportunities={opportunities}
        completedOpportunityIds={completedOpportunityIds}
        onToggleOpportunity={handleToggleOpportunity}
      />
    </div>
  );
}
