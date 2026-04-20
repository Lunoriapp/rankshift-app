export interface WorkspaceDashboardData {
  workspace: {
    name: string;
    rootDomain: string;
    averageScore: number;
    pagesNeedingAttention: number;
    outstandingTasks: number;
    internalLinkingOpportunities: number;
    lastScanDate: string;
    nextRecommendedAction: string;
  };
  healthSummary: {
    scoreDelta: string;
    monitoredPages: number;
    priorityFocus: string;
  };
  scoreDistribution: Array<{
    label: string;
    value: number;
    tone: "strong" | "steady" | "warning";
  }>;
  actionQueue: Array<{
    title: string;
    detail: string;
    status: "Now" | "Next" | "Monitor";
  }>;
  recentHighlights: Array<{
    label: string;
    value: string;
    context: string;
  }>;
}

export const mockWorkspaceDashboard: WorkspaceDashboardData = {
  workspace: {
    name: "Northstar Content",
    rootDomain: "northstarcontent.com",
    averageScore: 78,
    pagesNeedingAttention: 14,
    outstandingTasks: 27,
    internalLinkingOpportunities: 46,
    lastScanDate: "2026-04-17T09:30:00.000Z",
    nextRecommendedAction: "Refresh metadata and heading structure on the lowest-scoring service pages.",
  },
  healthSummary: {
    scoreDelta: "+6 this month",
    monitoredPages: 62,
    priorityFocus: "Commercial landing pages are improving, but blog-to-money-page linking is still underused.",
  },
  scoreDistribution: [
    { label: "Average score", value: 78, tone: "strong" },
    { label: "Pages needing attention", value: 14, tone: "warning" },
    { label: "Outstanding tasks", value: 27, tone: "steady" },
    { label: "Link opportunities", value: 46, tone: "strong" },
  ],
  actionQueue: [
    {
      title: "Fix missing meta descriptions",
      detail: "7 pages are ranking-capable but still missing a compelling description.",
      status: "Now",
    },
    {
      title: "Tighten H1 consistency",
      detail: "Homepage and 4 service pages have duplicate or vague primary headings.",
      status: "Next",
    },
    {
      title: "Add supporting internal links",
      detail: "Blog clusters can pass more authority into core conversion pages.",
      status: "Monitor",
    },
  ],
  recentHighlights: [
    {
      label: "Crawl coverage",
      value: "62 pages",
      context: "Up from 54 in the previous scan window.",
    },
    {
      label: "Quick wins",
      value: "11 tasks",
      context: "Low-effort fixes likely to improve visible SERP presentation.",
    },
    {
      label: "Most affected area",
      value: "Service pages",
      context: "Thin metadata and weak internal support are dragging the average down.",
    },
  ],
};
