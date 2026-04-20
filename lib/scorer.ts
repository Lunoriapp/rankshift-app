import type { CrawlResult } from "./crawler";

export interface ScoreCheck {
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
}

export interface ScorePillar {
  score: number;
  maxScore: number;
  checks: ScoreCheck[];
}

export interface OpportunityAssessment {
  score: number;
  projectedScore: number;
  uplift: number;
  label: "At Risk" | "Emerging" | "Strong" | "High Potential";
  rationale: string;
}

export interface ScoreBreakdown {
  total: number;
  maxScore: 100;
  opportunity?: OpportunityAssessment;
  pillars: {
    meta: ScorePillar;
    headings: ScorePillar;
    images: ScorePillar;
    performance: ScorePillar;
    schema: ScorePillar;
    internalLinking: ScorePillar;
  };
}

const TITLE_MIN = 10;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;
const RAW_TOTAL_MAX = 120;
const DISPLAY_TOTAL_MAX = 100;

function buildPillar(checks: ScoreCheck[], maxScore: number): ScorePillar {
  return {
    score: checks.reduce((sum, check) => sum + check.score, 0),
    maxScore,
    checks,
  };
}

function getImageScore(images: CrawlResult["images"]): number {
  if (images.length === 0) {
    return 20;
  }

  const withAltCount = images.filter((image) => image.alt.trim().length > 0).length;
  const ratio = withAltCount / images.length;

  if (ratio === 1) {
    return 20;
  }

  if (ratio >= 0.75) {
    return 15;
  }

  if (ratio >= 0.5) {
    return 10;
  }

  if (ratio > 0) {
    return 5;
  }

  return 0;
}

function getPerformanceScore(loadTimeMs: number): number {
  if (loadTimeMs < 2_000) {
    return 20;
  }

  if (loadTimeMs < 4_000) {
    return 10;
  }

  return 5;
}

function getInternalLinkCoverageScore(internalLinkCount: number): number {
  if (internalLinkCount >= 8) {
    return 10;
  }

  if (internalLinkCount >= 4) {
    return 7;
  }

  if (internalLinkCount >= 1) {
    return 4;
  }

  return 0;
}

function getInternalLinkOpportunityScore(data: CrawlResult): number {
  const opportunities = data.internalLinking?.opportunities ?? [];
  const highConfidenceCount = opportunities.filter(
    (opportunity) => opportunity.confidence === "High",
  ).length;
  const mediumConfidenceCount = opportunities.filter(
    (opportunity) => opportunity.confidence === "Medium",
  ).length;

  if (highConfidenceCount === 0 && mediumConfidenceCount <= 1) {
    return 10;
  }

  if (highConfidenceCount <= 1 && mediumConfidenceCount <= 3) {
    return 5;
  }

  return 0;
}

function normalizeToDisplayScore(value: number, rawMax = RAW_TOTAL_MAX): number {
  return Math.max(0, Math.min(DISPLAY_TOTAL_MAX, Math.round((value / rawMax) * DISPLAY_TOTAL_MAX)));
}

function getOpportunityLabel(score: number): OpportunityAssessment["label"] {
  if (score >= 80) {
    return "High Potential";
  }

  if (score >= 65) {
    return "Strong";
  }

  if (score >= 45) {
    return "Emerging";
  }

  return "At Risk";
}

function getOpportunityRationale(
  label: OpportunityAssessment["label"],
  uplift: number,
): string {
  if (label === "High Potential") {
    return uplift > 0
      ? "This page already has a solid SEO foundation and could improve further with a few targeted fixes."
      : "This page is already well aligned with strong technical and on-page SEO signals.";
  }

  if (label === "Strong") {
    return "This page has strong ranking signals, with clear upside still available from the missing improvements.";
  }

  if (label === "Emerging") {
    return "This page has useful search potential, but incomplete optimisation is still reducing ranking strength.";
  }

  return "This page is missing several core signals, which is limiting visibility and reducing ranking potential.";
}

function buildOpportunityAssessment(
  data: CrawlResult,
  total: number,
  metaScore: number,
  headingScore: number,
  imageScore: number,
  performanceScore: number,
  internalLinkingScore: number,
): OpportunityAssessment {
  const normalizedTotal = normalizeToDisplayScore(total);
  const canonicalScore = data.canonical ? 5 : 0;
  const opportunityScore = Math.min(
    100,
    metaScore +
      headingScore +
      imageScore / 2 +
      Math.round((performanceScore / 20) * 15) +
      (data.hasJsonLd ? 15 : 0) +
      Math.round((internalLinkingScore / 20) * 15) +
      canonicalScore,
  );

  const remainingGap = Math.max(0, 100 - normalizedTotal);
  const uplift = Math.min(18, Math.max(0, Math.ceil(remainingGap * 0.45)));
  const projectedScore = Math.min(100, normalizedTotal + uplift);
  const label = getOpportunityLabel(opportunityScore);

  return {
    score: opportunityScore,
    projectedScore,
    uplift,
    label,
    rationale: getOpportunityRationale(label, uplift),
  };
}

export function scoreAudit(data: CrawlResult): ScoreBreakdown {
  const titleIsValid =
    data.title.trim().length >= TITLE_MIN && data.title.trim().length <= TITLE_MAX;
  const descriptionIsValid =
    data.description.trim().length >= DESCRIPTION_MIN &&
    data.description.trim().length <= DESCRIPTION_MAX;
  const h1Count = data.headings.filter((heading) => heading.level === 1).length;
  const totalHeadings = data.headings.length;
  const imageScore = getImageScore(data.images);
  const performanceScore = getPerformanceScore(data.loadTimeMs);
  const internalLinkCoverageScore = getInternalLinkCoverageScore(data.internalLinkCount);
  const internalLinkOpportunityScore = getInternalLinkOpportunityScore(data);

  const meta = buildPillar(
    [
      {
        label: "Title length valid",
        passed: titleIsValid,
        score: titleIsValid ? 10 : 0,
        maxScore: 10,
      },
      {
        label: "Description length valid",
        passed: descriptionIsValid,
        score: descriptionIsValid ? 10 : 0,
        maxScore: 10,
      },
    ],
    20,
  );

  const headings = buildPillar(
    [
      {
        label: "Exactly 1 H1",
        passed: h1Count === 1,
        score: h1Count === 1 ? 10 : 0,
        maxScore: 10,
      },
      {
        label: "At least 3 headings total",
        passed: totalHeadings >= 3,
        score: totalHeadings >= 3 ? 10 : 0,
        maxScore: 10,
      },
    ],
    20,
  );

  const images = buildPillar(
    [
      {
        label: "Images with alt text coverage",
        passed: imageScore === 20,
        score: imageScore,
        maxScore: 20,
      },
    ],
    20,
  );

  const performance = buildPillar(
    [
      {
        label: "Page load time",
        passed: performanceScore === 20,
        score: performanceScore,
        maxScore: 20,
      },
    ],
    20,
  );

  const schema = buildPillar(
    [
      {
        label: "JSON-LD schema present",
        passed: data.hasJsonLd,
        score: data.hasJsonLd ? 20 : 0,
        maxScore: 20,
      },
    ],
    20,
  );

  const internalLinking = buildPillar(
    [
      {
        label: "Contextual internal link coverage supports this page",
        passed: internalLinkCoverageScore >= 7,
        score: internalLinkCoverageScore,
        maxScore: 10,
      },
      {
        label: "No high-confidence internal linking gaps at current crawl depth",
        passed: internalLinkOpportunityScore === 10,
        score: internalLinkOpportunityScore,
        maxScore: 10,
      },
    ],
    20,
  );

  const total =
    meta.score +
    headings.score +
    images.score +
    performance.score +
    schema.score +
    internalLinking.score;

  return {
    total: normalizeToDisplayScore(total),
    maxScore: 100,
    opportunity: buildOpportunityAssessment(
      data,
      total,
      meta.score,
      headings.score,
      images.score,
      performance.score,
      internalLinking.score,
    ),
    pillars: {
      meta,
      headings,
      images,
      performance,
      schema,
      internalLinking,
    },
  };
}
