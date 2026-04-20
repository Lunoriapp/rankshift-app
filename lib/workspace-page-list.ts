export type WorkspacePagePriority = "critical" | "high" | "medium" | "good";

export interface WorkspacePageListItem {
  id: string;
  title: string;
  url: string;
  score: number;
  previousScore: number | null;
  issueCount: number;
  priority: WorkspacePagePriority;
  lastScanned: string;
}

export function getWorkspacePagePriority(score: number): WorkspacePagePriority {
  if (score <= 39) {
    return "critical";
  }

  if (score <= 59) {
    return "high";
  }

  if (score <= 79) {
    return "medium";
  }

  return "good";
}

export function getScoreDelta(score: number, previousScore: number | null): number | null {
  if (previousScore === null) {
    return null;
  }

  return score - previousScore;
}

export function formatScoreDelta(delta: number | null): string {
  if (delta === null || delta === 0) {
    return "0";
  }

  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function formatLastScannedDate(value: string): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
