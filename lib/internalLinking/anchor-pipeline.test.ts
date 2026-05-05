import assert from "node:assert/strict";

import type { SitePageSnapshot } from "../crawler";
import { findLinkOpportunities } from "./findLinkOpportunities";
import { isValidAnchor, suggestAnchorText } from "./suggestAnchorText";
import type { SitePageTopicProfile } from "./types";
import { normalizeUrlForCompare } from "./urlCompare";

function makeTarget(overrides: Partial<SitePageTopicProfile>): SitePageTopicProfile {
  return {
    url: "https://example.com/services/recruitment-agency",
    canonicalUrl: null,
    title: "Recruitment Agency Services",
    h1: "Recruitment Agency",
    h2s: ["Executive Search", "Hiring Support"],
    primaryTopic: "recruitment agency services",
    topicPhrases: [{ phrase: "recruitment agency", source: "title", weight: 1 }],
    keywords: ["recruitment", "agency", "hiring"],
    bodyContexts: [],
    contentDebug: {
      selectedContentSelector: "main",
      totalHeadingCount: 0,
      paragraphCount: 0,
      listItemCount: 0,
      extractedBlockCount: 0,
      firstExtractedTextChunks: [],
      fallbackStrategyUsed: false,
      headingCounts: { h1: 0, h2: 0, h3: 0, h4: 0 },
      headingTexts: { h1: [], h2: [], h3: [], h4: [] },
      hasMultipleVisibleH1: false,
      contextualBodyLinks: [],
      blockedAnchorPhrases: [],
    },
    existingInternalLinkTargets: [],
    existingInternalLinkEntries: [],
    inboundInternalLinkCount: 0,
    outboundInternalLinkCount: 0,
    commerciallyImportant: true,
    pageType: "service",
    indexable: true,
    ...overrides,
  };
}

function makeSnapshot(url: string, title: string): SitePageSnapshot {
  return {
    url,
    title,
    description: "",
    h1: title,
    h2s: [title],
    headings: [{ level: 1, text: title }],
    images: [],
    bodyText:
      "This page contains enough content to pass the internal linking quality gate and be analysed for topic relationships.",
    contentSections: [
      {
        label: "Body",
        text: "This page contains enough content to pass the internal linking quality gate and be analysed for topic relationships.",
        type: "paragraph",
      },
    ],
    contentDebug: {
      selectedContentSelector: "main",
      totalHeadingCount: 1,
      paragraphCount: 1,
      listItemCount: 0,
      extractedBlockCount: 1,
      firstExtractedTextChunks: [
        "This page contains enough content to pass the internal linking quality gate and be analysed for topic relationships.",
      ],
      fallbackStrategyUsed: false,
      headingCounts: { h1: 1, h2: 0, h3: 0, h4: 0 },
      headingTexts: { h1: [title], h2: [], h3: [], h4: [] },
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

function run(): void {
  assert.equal(
    normalizeUrlForCompare("http://www.bob-dawson.co.uk/"),
    normalizeUrlForCompare("https://bob-dawson.co.uk/index.html"),
    "Expected protocol/www/index variants to normalize to the same page",
  );
  assert.equal(
    normalizeUrlForCompare("https://example.com/page/"),
    normalizeUrlForCompare("https://example.com/page"),
    "Expected trailing slash variants to normalize to the same page",
  );
  assert.equal(
    normalizeUrlForCompare("https://example.com/index.htm"),
    normalizeUrlForCompare("https://example.com/"),
    "Expected /index.htm to normalize to root",
  );
  assert.equal(
    normalizeUrlForCompare("https://example.com/page?a=1#part"),
    normalizeUrlForCompare("https://example.com/page"),
    "Expected query/hash variants to normalize to the same page",
  );

  const selfLinkReport = findLinkOpportunities(
    [
      makeSnapshot("https://www.bob-dawson.co.uk/", "Bob Dawson Sculptor"),
      makeSnapshot("http://bob-dawson.co.uk/index.html", "Bob Dawson Sculptor"),
    ],
    12,
  );
  assert.equal(
    selfLinkReport.opportunities.length,
    0,
    "Expected no suggestions when only self-equivalent URLs are present",
  );

  const rejected = [
    "bob s studio",
    "bobs studio can",
    "dawson who can",
    "dawson on 01933",
    "sculptures and his",
    "in contemporary",
  ];
  for (const anchor of rejected) {
    assert.equal(isValidAnchor(anchor), false, `Expected anchor to be rejected: ${anchor}`);
  }

  const accepted = [
    "Bob’s studio",
    "contemporary sculptor",
    "bronze sculptures",
    "sculpture commissions",
    "recruitment agency",
    "family mediation",
    "technical SEO audit",
  ];
  for (const anchor of accepted) {
    assert.equal(isValidAnchor(anchor), true, `Expected anchor to be valid: ${anchor}`);
  }

  const recruitmentTarget = makeTarget({
    url: "https://example.com/services/recruitment-agency",
    title: "Recruitment Agency Services",
    h1: "Recruitment Agency",
    h2s: ["Recruitment Services"],
    primaryTopic: "recruitment agency",
    topicPhrases: [{ phrase: "recruitment agency", source: "title", weight: 1 }],
    pageType: "service",
  });
  const recruitmentSentence =
    "Spencer & James are a unique recruitment agency, with extensive experience in the search and selection of quality candidates.";
  const recruitmentSuggestion = suggestAnchorText(recruitmentSentence, recruitmentTarget, {
    brandCandidates: ["spencer and james", "spencer & james"],
    sourcePageType: "service",
  });
  assert.equal(
    recruitmentSuggestion?.anchor,
    "recruitment agency",
    `Expected recruitment agency anchor, got: ${recruitmentSuggestion?.anchor ?? "null"}`,
  );

  const sculptureTarget = makeTarget({
    url: "https://example.com/bronze-sculptures",
    title: "Bronze Sculptures and Commissions",
    h1: "Bronze Sculptures",
    h2s: ["Commissioned Bronze Sculptures"],
    primaryTopic: "bronze sculptures",
    topicPhrases: [{ phrase: "bronze sculptures", source: "title", weight: 1 }],
    pageType: "profile",
  });
  const sculptureSentence =
    "Bob Dawson is a contemporary sculptor renowned for his bronze sculptures and his skill in working with materials such as cast aluminium, resin, plaster, concrete, and glass fibre.";
  const sculptureSuggestion = suggestAnchorText(sculptureSentence, sculptureTarget, {
    brandCandidates: ["bob dawson", "dawson"],
    sourcePageType: "profile",
  });
  assert.equal(
    sculptureSuggestion?.anchor,
    "bronze sculptures",
    `Expected bronze sculptures anchor, got: ${sculptureSuggestion?.anchor ?? "null"}`,
  );

  const studioTarget = makeTarget({
    url: "https://example.com/sculpture-studio",
    title: "Sculpture Studio and Commissions",
    h1: "Sculpture Studio",
    h2s: ["Studio Profile"],
    primaryTopic: "sculpture studio",
    topicPhrases: [{ phrase: "sculpture studio", source: "title", weight: 1 }],
    pageType: "profile",
  });
  const studioSentence = "Bob’s studio can be seen on this web site and showcases his contemporary works.";
  const studioSuggestion = suggestAnchorText(studioSentence, studioTarget, {
    brandCandidates: ["bob dawson", "dawson"],
    sourcePageType: "profile",
  });
  assert.equal(
    studioSuggestion?.anchor,
    "Bob’s studio",
    `Expected Bob’s studio anchor, got: ${studioSuggestion?.anchor ?? "null"}`,
  );

  console.log("anchor-pipeline tests passed");
}

run();
