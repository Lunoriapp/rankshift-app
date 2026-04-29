import type { SitePageSnapshot } from "../crawler";

import { findLinkOpportunities } from "./findLinkOpportunities";

interface RegressionCheckResult {
  selectedAnchorForServices: string | null;
  hasBrandAnchorSuggestion: boolean;
  hasAboutSuggestion: boolean;
  headingPhraseSelected: boolean;
  opportunitiesCount: number;
}

function buildSourceSnapshot(): SitePageSnapshot {
  const sourceUrl = "https://example-legal.co.uk/services/recruitment";

  return {
    url: sourceUrl,
    title: "Recruitment Agency Services | Example Legal",
    description: "",
    h1: "Example Legal",
    h2s: ["Recruitment Agency Services"],
    headings: [
      { level: 1, text: "Example Legal" },
      { level: 2, text: "Recruitment Agency Services" },
    ],
    images: [],
    bodyText:
      "Example Legal are a unique recruitment agency, with extensive experience in the search and selection of quality candidates.",
    contentSections: [
      {
        label: "Introduction",
        type: "paragraph",
        text: "Example Legal are a unique recruitment agency, with extensive experience in the search and selection of quality candidates.",
      },
    ],
    contentDebug: {
      selectedContentSelector: "main",
      totalHeadingCount: 2,
      paragraphCount: 1,
      listItemCount: 0,
      extractedBlockCount: 1,
      firstExtractedTextChunks: [
        "Example Legal are a unique recruitment agency, with extensive experience in the search and selection of quality candidates.",
      ],
      fallbackStrategyUsed: false,
      headingCounts: {
        h1: 1,
        h2: 1,
        h3: 0,
        h4: 0,
      },
      headingTexts: {
        h1: ["Example Legal"],
        h2: ["Recruitment Agency Services"],
        h3: [],
        h4: [],
      },
      hasMultipleVisibleH1: false,
      contextualBodyLinks: [],
      blockedAnchorPhrases: ["example legal"],
    },
    existingInternalLinks: [
      {
        href: "/about-us",
        text: "About Us",
        resolvedUrl: "https://example-legal.co.uk/about-us",
        normalizedUrl: "https://example-legal.co.uk/about-us",
      },
    ],
    canonical: null,
    robots: null,
    indexable: true,
    statusCode: 200,
    contentType: "text/html",
    hasJsonLd: false,
  };
}

function buildTargetSnapshot(
  url: string,
  title: string,
  h1: string,
  h2s: string[],
): SitePageSnapshot {
  const syntheticBody = [title, h1, ...h2s, `${h1} and related guidance.`].join(" ");

  return {
    url,
    title,
    description: "",
    h1,
    h2s,
    headings: [{ level: 1, text: h1 }, ...h2s.map((text) => ({ level: 2 as const, text }))],
    images: [],
    bodyText: syntheticBody,
    contentSections: [{ label: "Introduction", text: syntheticBody, type: "paragraph" }],
    contentDebug: {
      selectedContentSelector: "synthetic",
      totalHeadingCount: 1 + h2s.length,
      paragraphCount: 1,
      listItemCount: 0,
      extractedBlockCount: 1,
      firstExtractedTextChunks: [syntheticBody],
      fallbackStrategyUsed: false,
      headingCounts: {
        h1: 1,
        h2: h2s.length,
        h3: 0,
        h4: 0,
      },
      headingTexts: {
        h1: [h1],
        h2: h2s,
        h3: [],
        h4: [],
      },
      hasMultipleVisibleH1: false,
      contextualBodyLinks: [],
      blockedAnchorPhrases: [],
    },
    existingInternalLinks: [],
    canonical: null,
    robots: null,
    indexable: true,
    statusCode: 200,
    contentType: "text/html",
    hasJsonLd: false,
  };
}

export function runRecruitmentRegressionCheck(): RegressionCheckResult {
  const source = buildSourceSnapshot();
  const servicesTarget = buildTargetSnapshot(
    "https://example-legal.co.uk/recruitment-agency-services",
    "Recruitment Agency Services | Example Legal",
    "Recruitment Agency Services",
    ["Candidate Search and Selection"],
  );
  const aboutTarget = buildTargetSnapshot(
    "https://example-legal.co.uk/about-us",
    "About Us | Example Legal",
    "About Example Legal",
    ["Our Story"],
  );

  const report = findLinkOpportunities([source, servicesTarget, aboutTarget], 24, {
    sourceUrl: source.url,
  });

  const servicesOpportunity = report.opportunities.find(
    (opportunity) => opportunity.targetUrl === servicesTarget.url,
  );
  const aboutOpportunity = report.opportunities.find(
    (opportunity) => opportunity.targetUrl === aboutTarget.url,
  );
  const hasBrandAnchorSuggestion = report.opportunities.some(
    (opportunity) =>
      opportunity.suggestedAnchor?.toLowerCase().trim() === "example legal",
  );
  const headingPhraseSelected = report.opportunities.some((opportunity) =>
    (opportunity.suggestedAnchor ?? "").toLowerCase().includes("example legal"),
  );

  return {
    selectedAnchorForServices: servicesOpportunity?.suggestedAnchor ?? null,
    hasBrandAnchorSuggestion,
    hasAboutSuggestion: Boolean(aboutOpportunity),
    headingPhraseSelected,
    opportunitiesCount: report.opportunities.length,
  };
}
