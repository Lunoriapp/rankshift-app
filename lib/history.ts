import type { AuditHistoryEntry } from "@/lib/supabase";

export interface HistoryInterpretation {
  headline: string;
  body: string;
  tone: "positive" | "neutral" | "warning";
}

function signedValue(value: number | null): string {
  if (value === null) {
    return "Baseline";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

export function formatHistoryDelta(value: number | null, invertMeaning = false): string {
  if (value === null) {
    return "Baseline";
  }

  const adjusted = invertMeaning ? value * -1 : value;
  return signedValue(adjusted);
}

export function interpretAuditHistory(entry: AuditHistoryEntry | undefined): HistoryInterpretation {
  if (!entry || entry.scoreDelta === null) {
    return {
      headline: "This scan is your baseline",
      body: "Use this run as the reference point. The next scan will show whether score, issue count, and internal linking coverage are improving in the right direction.",
      tone: "neutral",
    };
  }

  const scoreUp = entry.scoreDelta > 0;
  const issuesDown = (entry.issueCountDelta ?? 0) < 0;
  const linksDown = (entry.internalLinkOpportunityDelta ?? 0) < 0;

  if (scoreUp && issuesDown && linksDown) {
    return {
      headline: "The page is moving in the right direction",
      body: `Score is up ${signedValue(entry.scoreDelta)}, while issues and internal link gaps are both down versus the previous scan.`,
      tone: "positive",
    };
  }

  if (!scoreUp && !issuesDown) {
    return {
      headline: "Recent changes are not improving the page yet",
      body: `Score changed ${signedValue(entry.scoreDelta)} and issue count changed ${signedValue(entry.issueCountDelta)}. Recheck the highest-impact fixes before the next scan.`,
      tone: "warning",
    };
  }

  return {
    headline: "Some signals are improving, but the page is still mixed",
    body: `Score changed ${signedValue(entry.scoreDelta)}, issue count changed ${signedValue(entry.issueCountDelta)}, and internal linking opportunities changed ${signedValue(entry.internalLinkOpportunityDelta)}.`,
    tone: "neutral",
  };
}
