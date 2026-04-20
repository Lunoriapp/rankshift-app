import { buildAuditFixes } from "./audit-fixes";
import type { AiFixOutput } from "./ai";
import type {
  AuditFixStateRecord,
  AuditHistoryEntry,
  AuditRecord,
} from "./supabase";
import type {
  CrawlContentDebug,
  CrawlContentSection,
  CrawlHeading,
  CrawlImage,
  CrawlInternalLink,
  CrawlResult,
} from "./crawler";
import type { InternalLinkOpportunity } from "./internalLinking/types";
import type { ScoreBreakdown } from "./scorer";

export interface ExampleReportPayload {
  audit: AuditRecord;
  history: AuditHistoryEntry[];
  fixStates: AuditFixStateRecord[];
}

const EXAMPLE_URL = "https://www.rankshift.ai/example/local-seo-audit";

const contentSections: CrawlContentSection[] = [
  {
    label: "Intro",
    type: "paragraph",
    text: "Rankshift helps local teams identify weak page signals, fix metadata, and improve contextual internal links that support service pages.",
  },
  {
    label: "Internal linking",
    type: "paragraph",
    text: "The page mentions local SEO audits, technical SEO support, and service landing pages but does not always link users through to the best destination.",
  },
  {
    label: "Proof",
    type: "list_item",
    text: "Audit priorities, rewrite recommendations, and page-level score movement are all saved so teams can track progress over time.",
  },
];

const contentDebug: CrawlContentDebug = {
  selectedContentSelector: ".article-body",
  totalHeadingCount: 5,
  paragraphCount: 3,
  listItemCount: 1,
  extractedBlockCount: 4,
  firstExtractedTextChunks: contentSections.map((section) => section.text).slice(0, 3),
  fallbackStrategyUsed: false,
  headingCounts: {
    h1: 1,
    h2: 2,
    h3: 2,
    h4: 0,
  },
  headingTexts: {
    h1: ["Local SEO Audit Template for Growth Teams"],
    h2: ["What this page gets right", "Where score gains still exist"],
    h3: ["Rewrite weak metadata", "Add stronger internal links"],
    h4: [],
  },
  hasMultipleVisibleH1: false,
  contextualBodyLinks: [
    {
      href: "https://www.rankshift.ai/features/page-audits",
      text: "page audits",
    },
  ],
};

const headings: CrawlHeading[] = [
  { level: 1, text: "Local SEO Audit Template for Growth Teams" },
  { level: 2, text: "What this page gets right" },
  { level: 2, text: "Where score gains still exist" },
  { level: 3, text: "Rewrite weak metadata" },
  { level: 3, text: "Add stronger internal links" },
];

const images: CrawlImage[] = [
  {
    src: "https://www.rankshift.ai/images/dashboard-preview.webp",
    alt: "Rankshift audit dashboard preview",
    fileName: "dashboard-preview.webp",
    surroundingText: "Rankshift dashboard preview with score cards and action plan.",
    suggestedAlt: "Rankshift SEO audit dashboard preview",
    isMissingAlt: false,
  },
  {
    src: "https://www.rankshift.ai/images/report-card.png",
    alt: "",
    fileName: "report-card.png",
    surroundingText: "Saved report summary card showing score movement and open fixes.",
    suggestedAlt: "Saved report summary card",
    isMissingAlt: true,
  },
];

const existingInternalLinks: CrawlInternalLink[] = [
  {
    href: "https://www.rankshift.ai/features/page-audits",
    text: "page audits",
    normalizedUrl: "https://www.rankshift.ai/features/page-audits",
  },
];

const opportunities: InternalLinkOpportunity[] = [
  {
    id: "example-link-1",
    sourceUrl: EXAMPLE_URL,
    sourceTitle: "Local SEO Audit Template for Growth Teams",
    targetUrl: "https://www.rankshift.ai/features/internal-linking",
    targetTitle: "Internal Linking Recommendations",
    suggestedAnchor: "internal linking recommendations",
    matchedSnippet:
      "The page mentions local SEO audits, technical SEO support, and internal linking recommendations but does not always link users through to the best destination.",
    placementHint: 'Paragraph under "Where score gains still exist"',
    reason:
      "The page already introduces internal linking as a clear subtopic, so adding the destination page here would improve discovery and reinforce topical depth.",
    confidence: "High",
    confidenceScore: 91,
    status: "open",
    category: "Internal linking",
  },
  {
    id: "example-link-2",
    sourceUrl: EXAMPLE_URL,
    sourceTitle: "Local SEO Audit Template for Growth Teams",
    targetUrl: "https://www.rankshift.ai/features/scan-history",
    targetTitle: "SEO Scan History",
    suggestedAnchor: "scan history",
    matchedSnippet:
      "Audit priorities, rewrite recommendations, and scan history are all saved so teams can track progress over time.",
    placementHint: 'List item under "Proof"',
    reason:
      "The source copy already promises historical tracking, so linking directly to the scan-history feature makes the workflow easier to understand.",
    confidence: "Medium",
    confidenceScore: 78,
    status: "open",
    category: "Internal linking",
  },
];

const crawl: CrawlResult = {
  url: EXAMPLE_URL,
  title: "Local SEO Audit Template | Rankshift",
  description:
    "Audit a page, identify the biggest SEO gaps, and see what to fix next with saved score movement and internal link opportunities.",
  headings,
  images,
  canonical: EXAMPLE_URL,
  robots: "index,follow",
  internalLinkCount: 2,
  hasJsonLd: false,
  loadTimeMs: 2680,
  bodyText: contentSections.map((section) => section.text).join(" "),
  h1: "Local SEO Audit Template for Growth Teams",
  h2s: ["What this page gets right", "Where score gains still exist"],
  contentSections,
  contentDebug,
  existingInternalLinks,
  indexable: true,
  statusCode: 200,
  contentType: "text/html",
  internalLinking: {
    pages: [],
    opportunities,
    scannedPageCount: 12,
    debug: [],
  },
};

const score: ScoreBreakdown = {
  total: 62,
  maxScore: 100,
  opportunity: {
    score: 78,
    projectedScore: 69,
    uplift: 7,
    label: "Strong",
    rationale:
      "This example page already has a solid structure, but stronger schema, image metadata, and contextual links would move it into a more competitive range.",
  },
  pillars: {
    meta: {
      score: 20,
      maxScore: 20,
      checks: [
        { label: "Title length valid", passed: true, score: 10, maxScore: 10 },
        { label: "Description length valid", passed: true, score: 10, maxScore: 10 },
      ],
    },
    headings: {
      score: 20,
      maxScore: 20,
      checks: [
        { label: "Exactly 1 H1", passed: true, score: 10, maxScore: 10 },
        { label: "At least 3 headings total", passed: true, score: 10, maxScore: 10 },
      ],
    },
    images: {
      score: 10,
      maxScore: 20,
      checks: [
        {
          label: "Images with alt text coverage",
          passed: false,
          score: 10,
          maxScore: 20,
        },
      ],
    },
    performance: {
      score: 10,
      maxScore: 20,
      checks: [
        {
          label: "Page load time below 2 seconds",
          passed: false,
          score: 10,
          maxScore: 20,
        },
      ],
    },
    schema: {
      score: 0,
      maxScore: 20,
      checks: [
        {
          label: "JSON-LD schema detected",
          passed: false,
          score: 0,
          maxScore: 20,
        },
      ],
    },
    internalLinking: {
      score: 12,
      maxScore: 20,
      checks: [
        {
          label: "Contextual internal links present",
          passed: true,
          score: 7,
          maxScore: 10,
        },
        {
          label: "Internal link opportunities largely covered",
          passed: false,
          score: 5,
          maxScore: 10,
        },
      ],
    },
  },
};

const aiOutput: AiFixOutput = {
  fixes: {
    critical: [],
    high: [
      "Add descriptive alt text to the report card preview image.",
      "Add JSON-LD schema so the page has stronger machine-readable context.",
    ],
    medium: [
      "Add a couple of stronger contextual internal links to nearby feature pages.",
      "Reduce load friction so the page reaches content more quickly.",
    ],
  },
  rewrites: {
    title: "Local SEO Audit Template for Growth Teams | Rankshift",
    description:
      "Audit any page, spot the biggest SEO gaps, and track what improved with saved reports, score movement, and internal linking recommendations.",
    h1: "Local SEO Audit Template for Growth Teams",
  },
};

const fixes = buildAuditFixes(crawl, score, aiOutput);

export function getExampleReportPayload(): ExampleReportPayload {
  const audit: AuditRecord = {
    id: 101,
    user_id: null,
    url: EXAMPLE_URL,
    url_key: "www.rankshift.ai/example/local-seo-audit",
    crawl,
    score,
    ai_output: aiOutput,
    fixes,
    created_at: "2026-04-20T09:00:00.000Z",
  };

  const history: AuditHistoryEntry[] = [
    {
      id: 101,
      url: EXAMPLE_URL,
      created_at: "2026-04-20T09:00:00.000Z",
      score: 62,
      previousScore: 58,
      scoreDelta: 4,
      issueCount: fixes.length,
      previousIssueCount: fixes.length + 2,
      issueCountDelta: -2,
      internalLinkOpportunityCount: opportunities.length,
      previousInternalLinkOpportunityCount: opportunities.length + 3,
      internalLinkOpportunityDelta: -3,
    },
    {
      id: 100,
      url: EXAMPLE_URL,
      created_at: "2026-04-12T09:00:00.000Z",
      score: 58,
      previousScore: null,
      scoreDelta: null,
      issueCount: fixes.length + 2,
      previousIssueCount: null,
      issueCountDelta: null,
      internalLinkOpportunityCount: opportunities.length + 3,
      previousInternalLinkOpportunityCount: null,
      internalLinkOpportunityDelta: null,
    },
  ];

  const fixStates: AuditFixStateRecord[] = [
    {
      audit_id: 101,
      fix_id: "meta-title",
      severity: "critical",
      completed: true,
      completed_at: "2026-04-20T09:10:00.000Z",
    },
    {
      audit_id: 101,
      fix_id: "single-h1",
      severity: "critical",
      completed: true,
      completed_at: "2026-04-20T09:12:00.000Z",
    },
  ];

  return {
    audit,
    history,
    fixStates,
  };
}
