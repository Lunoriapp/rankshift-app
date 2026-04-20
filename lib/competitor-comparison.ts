import type { CrawlResult } from "./crawler";
import type { ScoreBreakdown } from "./scorer";
import type { CompetitorSnapshotRecord } from "./supabase";

export interface CompetitorSnapshot {
  name: string;
  url?: string | null;
  score: number;
  titleLength: number;
  h1: boolean;
  wordCount: number;
  internalLinks: number;
  schema: boolean;
}

export interface CompetitorComparisonData {
  user: CompetitorSnapshot;
  competitors: [CompetitorSnapshot, CompetitorSnapshot];
}

export interface ComparisonMetricRow {
  key: "score" | "titleLength" | "h1" | "wordCount" | "internalLinks" | "schema";
  label: string;
  userValue: string;
  competitorAValue: string;
  competitorBValue: string;
  userTone: "strong" | "weak" | "neutral";
  competitorATone: "strong" | "weak" | "neutral";
  competitorBTone: "strong" | "weak" | "neutral";
}

export interface CompetitorInsights {
  reasons: string[];
  fixes: string[];
}

export const competitorComparisonData: CompetitorComparisonData = {
  user: {
    name: "Your Page",
    score: 50,
    titleLength: 82,
    h1: false,
    wordCount: 620,
    internalLinks: 3,
    schema: false,
  },
  competitors: [
    {
      name: "Competitor A",
      score: 72,
      titleLength: 58,
      h1: true,
      wordCount: 1400,
      internalLinks: 12,
      schema: true,
    },
    {
      name: "Competitor B",
      score: 68,
      titleLength: 61,
      h1: true,
      wordCount: 1200,
      internalLinks: 9,
      schema: true,
    },
  ],
};

function getWordCount(bodyText: string): number {
  return bodyText.split(/\s+/).filter(Boolean).length;
}

function createMockCompetitor(input: {
  name: string;
  url: string;
  score: number;
  titleLength: number;
  h1: boolean;
  wordCount: number;
  internalLinks: number;
  schema: boolean;
}): CompetitorSnapshot {
  return input;
}

function buildFallbackCompetitorsFromUserMetrics(input: {
  url: string;
  score: number;
  wordCount: number;
  internalLinks: number;
}): CompetitorComparisonData["competitors"] {
  const source = new URL(input.url);
  const path = source.pathname === "/" ? "/service-page" : source.pathname;

  return [
    createMockCompetitor({
      name: "Competitor A",
      url: `https://competitor-a.example${path}`,
      score: Math.min(Math.max(input.score, 42) + 18, 92),
      titleLength: 58,
      h1: true,
      wordCount: Math.max(input.wordCount + 650, 1200),
      internalLinks: Math.max(input.internalLinks + 6, 8),
      schema: true,
    }),
    createMockCompetitor({
      name: "Competitor B",
      url: `https://competitor-b.example${path}`,
      score: Math.min(Math.max(input.score, 42) + 13, 88),
      titleLength: 61,
      h1: true,
      wordCount: Math.max(input.wordCount + 450, 1050),
      internalLinks: Math.max(input.internalLinks + 4, 7),
      schema: true,
    }),
  ];
}

export function buildAuditCompetitorComparisonData(
  crawl: CrawlResult,
  score: ScoreBreakdown,
): CompetitorComparisonData {
  const userWordCount = getWordCount(crawl.bodyText);

  return {
    user: {
      name: "Your Page",
      url: crawl.url,
      score: score.total,
      titleLength: crawl.title.trim().length,
      h1: crawl.h1.trim().length > 0,
      wordCount: getWordCount(crawl.bodyText),
      internalLinks: crawl.internalLinkCount,
      schema: crawl.hasJsonLd,
    },
    competitors: buildFallbackCompetitorsFromUserMetrics({
      url: crawl.url,
      score: score.total,
      wordCount: userWordCount,
      internalLinks: crawl.internalLinkCount,
    }),
  };
}

export function buildCompetitorComparisonDataFromAudit(
  input: {
    score: number;
    titleLength: number;
    h1Present: boolean;
    wordCount: number;
    internalLinks: number;
    schemaPresent: boolean;
    url: string;
  },
  snapshots: CompetitorSnapshotRecord[],
): CompetitorComparisonData {
  const competitors = snapshots.slice(0, 2).map((snapshot) => ({
    name: snapshot.competitor_name,
    url: snapshot.competitor_url,
    score: snapshot.score,
    titleLength: snapshot.title_length,
    h1: snapshot.h1_present,
    wordCount: snapshot.word_count,
    internalLinks: snapshot.internal_links,
    schema: snapshot.schema_present,
  })) as CompetitorComparisonData["competitors"];

  return {
    user: {
      name: "Your Page",
      url: input.url,
      score: input.score,
      titleLength: input.titleLength,
      h1: input.h1Present,
      wordCount: input.wordCount,
      internalLinks: input.internalLinks,
      schema: input.schemaPresent,
    },
    competitors:
      competitors.length === 2
        ? competitors
        : buildFallbackCompetitorsFromUserMetrics({
            url: input.url,
            score: input.score,
            wordCount: input.wordCount,
            internalLinks: input.internalLinks,
          }),
  };
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

function titleLengthTone(length: number): "strong" | "weak" | "neutral" {
  if (length >= 50 && length <= 65) {
    return "strong";
  }

  if (length < 40 || length > 70) {
    return "weak";
  }

  return "neutral";
}

function numericTone(
  value: number,
  values: number[],
  options?: { higherIsBetter?: boolean },
): "strong" | "weak" | "neutral" {
  const higherIsBetter = options?.higherIsBetter ?? true;
  const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
  const worst = higherIsBetter ? Math.min(...values) : Math.max(...values);

  if (value === best && value !== worst) {
    return "strong";
  }

  if (value === worst && value !== best) {
    return "weak";
  }

  return "neutral";
}

export function buildComparisonRows(
  data: CompetitorComparisonData,
): ComparisonMetricRow[] {
  const [competitorA, competitorB] = data.competitors;
  const scoreValues = [data.user.score, competitorA.score, competitorB.score];
  const wordCountValues = [
    data.user.wordCount,
    competitorA.wordCount,
    competitorB.wordCount,
  ];
  const internalLinkValues = [
    data.user.internalLinks,
    competitorA.internalLinks,
    competitorB.internalLinks,
  ];

  return [
    {
      key: "score",
      label: "SEO Score",
      userValue: `${data.user.score}`,
      competitorAValue: `${competitorA.score}`,
      competitorBValue: `${competitorB.score}`,
      userTone: numericTone(data.user.score, scoreValues),
      competitorATone: numericTone(competitorA.score, scoreValues),
      competitorBTone: numericTone(competitorB.score, scoreValues),
    },
    {
      key: "titleLength",
      label: "Title Length",
      userValue: `${data.user.titleLength}`,
      competitorAValue: `${competitorA.titleLength}`,
      competitorBValue: `${competitorB.titleLength}`,
      userTone: titleLengthTone(data.user.titleLength),
      competitorATone: titleLengthTone(competitorA.titleLength),
      competitorBTone: titleLengthTone(competitorB.titleLength),
    },
    {
      key: "h1",
      label: "H1 Present",
      userValue: formatBoolean(data.user.h1),
      competitorAValue: formatBoolean(competitorA.h1),
      competitorBValue: formatBoolean(competitorB.h1),
      userTone: data.user.h1 ? "strong" : "weak",
      competitorATone: competitorA.h1 ? "strong" : "weak",
      competitorBTone: competitorB.h1 ? "strong" : "weak",
    },
    {
      key: "wordCount",
      label: "Word Count",
      userValue: `${data.user.wordCount}`,
      competitorAValue: `${competitorA.wordCount}`,
      competitorBValue: `${competitorB.wordCount}`,
      userTone: numericTone(data.user.wordCount, wordCountValues),
      competitorATone: numericTone(competitorA.wordCount, wordCountValues),
      competitorBTone: numericTone(competitorB.wordCount, wordCountValues),
    },
    {
      key: "internalLinks",
      label: "Internal Links",
      userValue: `${data.user.internalLinks}`,
      competitorAValue: `${competitorA.internalLinks}`,
      competitorBValue: `${competitorB.internalLinks}`,
      userTone: numericTone(data.user.internalLinks, internalLinkValues),
      competitorATone: numericTone(competitorA.internalLinks, internalLinkValues),
      competitorBTone: numericTone(competitorB.internalLinks, internalLinkValues),
    },
    {
      key: "schema",
      label: "Schema Present",
      userValue: formatBoolean(data.user.schema),
      competitorAValue: formatBoolean(competitorA.schema),
      competitorBValue: formatBoolean(competitorB.schema),
      userTone: data.user.schema ? "strong" : "weak",
      competitorATone: competitorA.schema ? "strong" : "weak",
      competitorBTone: competitorB.schema ? "strong" : "weak",
    },
  ];
}

export function buildCompetitorInsights(
  data: CompetitorComparisonData,
): CompetitorInsights {
  const [competitorA, competitorB] = data.competitors;
  const averageWordCount = Math.round(
    (competitorA.wordCount + competitorB.wordCount) / data.competitors.length,
  );
  const averageInternalLinks = Math.round(
    (competitorA.internalLinks + competitorB.internalLinks) / data.competitors.length,
  );

  const reasons: string[] = [];
  const fixes: string[] = [];

  if (data.user.wordCount < averageWordCount) {
    reasons.push("Shorter content");
    fixes.push(`Add ${Math.max(800, averageWordCount - data.user.wordCount)} to 1200 words`);
  }

  if (!data.user.h1 || data.user.titleLength > 70 || data.user.titleLength < 40) {
    reasons.push("Missing H1 or poor structure");
    fixes.push("Add proper H1 and H2 structure");
  }

  if (data.user.internalLinks < averageInternalLinks) {
    reasons.push("Fewer internal links");
    fixes.push("Add 5 to 10 internal links");
  }

  if (reasons.length === 0) {
    reasons.push("Competitors still have stronger overall on-page execution");
  }

  if (fixes.length === 0) {
    fixes.push("Tighten page structure and strengthen topical depth");
  }

  return { reasons, fixes };
}
