import { chromium } from "playwright";

import type { SitePageSnapshot } from "@/lib/crawler";
import { extractEditorialContentInBrowser } from "@/lib/internalLinking/editorialExtractor";
import { analyseSiteTopics } from "@/lib/internalLinking/analyseSiteTopics";
import { findLinkOpportunities } from "@/lib/internalLinking/findLinkOpportunities";
import type { InternalLinkOpportunity } from "@/lib/internalLinking/types";

export interface InternalLinkHarnessTargetInput {
  url: string;
  title: string;
  h1: string;
  h2s: string[];
}

export interface InternalLinkHarnessInput {
  sourceHtml: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourceDescription?: string;
  targets: InternalLinkHarnessTargetInput[];
  debugMode?: boolean;
}

export interface ControlledInternalLinkHarnessInput {
  sourceHtml: string;
  sourceUrl: string;
  sourceTitle: string;
  targetUrl: string;
  targetTitle: string;
  targetH1: string;
  targetH2s?: string[];
  debugMode?: boolean;
}

export interface InternalLinkHarnessResult {
  extractedContentSummary: {
    sourceUrl: string;
    selectedContentSelector: string;
    paragraphCount: number;
    extractedChunkCount: number;
    firstFiveTextChunks: string[];
    headingCounts: {
      h1: number;
      h2: number;
      h3: number;
      h4: number;
    };
    extractedHeadings: {
      h1: string[];
      h2: string[];
      h3: string[];
      h4: string[];
    };
    contextualBodyLinks: Array<{
      href: string;
      text: string;
    }>;
  };
  targetPhraseList: Array<{
    targetUrl: string;
    targetTitle: string;
    phrases: string[];
  }>;
  matchedChunks: Array<{
    targetUrl: string;
    snippets: string[];
  }>;
  opportunitiesFound: InternalLinkOpportunity[];
  rejectionReasons: Array<{
    targetUrl: string;
    decision: "accepted" | "rejected" | "skipped";
    reasons: string[];
    matchedSnippets: string[];
  }>;
}

function buildSyntheticTargetBody(target: InternalLinkHarnessTargetInput): string {
  return [
    target.title,
    target.h1,
    ...target.h2s,
    `${target.h1} helps users understand the page focus and the offer in more detail.`,
    `${target.title} explains the main topic with enough repeated context for phrase extraction.`,
    `This page also covers ${target.h2s.join(", ")} and related guidance for the same topic.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildTargetSnapshot(target: InternalLinkHarnessTargetInput): SitePageSnapshot {
  const syntheticBody = buildSyntheticTargetBody(target);

  return {
    url: target.url,
    title: target.title,
    description: "",
    h1: target.h1,
    h2s: target.h2s,
    headings: [
      { level: 1, text: target.h1 },
      ...target.h2s.map((heading) => ({ level: 2 as const, text: heading })),
    ],
    images: [],
    bodyText: syntheticBody,
    contentSections: [
      {
        label: "Introduction",
        text: syntheticBody,
        type: "paragraph",
      },
    ],
    contentDebug: {
      selectedContentSelector: "synthetic-target",
      totalHeadingCount: 1 + target.h2s.length,
      paragraphCount: 1,
      listItemCount: 0,
      extractedBlockCount: 1,
      firstExtractedTextChunks: [syntheticBody],
      fallbackStrategyUsed: false,
      headingCounts: {
        h1: 1,
        h2: target.h2s.length,
        h3: 0,
        h4: 0,
      },
      headingTexts: {
        h1: [target.h1],
        h2: target.h2s,
        h3: [],
        h4: [],
      },
      hasMultipleVisibleH1: false,
      contextualBodyLinks: [],
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

export function logInternalLinkHarnessResult(result: InternalLinkHarnessResult) {
  console.debug(
    `[internal-link-harness] selector=${result.extractedContentSummary.selectedContentSelector}`,
  );
  console.debug(
    `[internal-link-harness] headings h1=${result.extractedContentSummary.headingCounts.h1} h2=${result.extractedContentSummary.headingCounts.h2} h3=${result.extractedContentSummary.headingCounts.h3} h4=${result.extractedContentSummary.headingCounts.h4}`,
  );
  console.debug(
    `[internal-link-harness] heading_texts h1=${result.extractedContentSummary.extractedHeadings.h1.join(" | ") || "(none)"}`,
  );
  console.debug(
    `[internal-link-harness] heading_texts h2=${result.extractedContentSummary.extractedHeadings.h2.join(" | ") || "(none)"}`,
  );
  console.debug(
    `[internal-link-harness] heading_texts h3=${result.extractedContentSummary.extractedHeadings.h3.join(" | ") || "(none)"}`,
  );
  console.debug(
    `[internal-link-harness] paragraph_count=${result.extractedContentSummary.paragraphCount} chunks=${result.extractedContentSummary.extractedChunkCount}`,
  );

  for (const [index, chunk] of result.extractedContentSummary.firstFiveTextChunks.entries()) {
    console.debug(`[internal-link-harness] chunk_${index + 1}=${chunk}`);
  }

  console.debug(
    `[internal-link-harness] contextual_links=${result.extractedContentSummary.contextualBodyLinks
      .map((link) => `${link.text} -> ${link.href}`)
      .join(" || ") || "(none)"}`,
  );

  for (const target of result.targetPhraseList) {
    console.debug(
      `[internal-link-harness] target=${target.targetUrl} phrases=${target.phrases.join(" | ") || "(none)"}`,
    );
  }

  for (const matched of result.matchedChunks) {
    console.debug(
      `[internal-link-harness] matched_chunks target=${matched.targetUrl} snippets=${matched.snippets.join(" || ") || "(none)"}`,
    );
  }

  for (const evaluation of result.rejectionReasons) {
    console.debug(`[internal-link-harness] decision=${evaluation.decision} target=${evaluation.targetUrl}`);
    console.debug(
      `[internal-link-harness] matched_snippets=${evaluation.matchedSnippets.join(" || ") || "(none)"}`,
    );

    for (const reason of evaluation.reasons) {
      console.debug(`[internal-link-harness] reason=${reason}`);
    }
  }

  for (const opportunity of result.opportunitiesFound) {
    console.debug(
      `[internal-link-harness] opportunity source=${opportunity.sourceUrl} target=${opportunity.targetUrl} anchor=${opportunity.suggestedAnchor} confidence=${opportunity.confidence}`,
    );
    console.debug(`[internal-link-harness] opportunity_snippet=${opportunity.matchedSnippet}`);
    console.debug(`[internal-link-harness] opportunity_placement=${opportunity.placementHint}`);
  }
}

export async function runInternalLinkingDebugHarness(
  input: InternalLinkHarnessInput,
): Promise<InternalLinkHarnessResult> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(input.sourceHtml, { waitUntil: "domcontentloaded" });

    const editorial = await page.evaluate(extractEditorialContentInBrowser, {
      cookiePatterns: ["cookie", "consent", "privacy", "gdpr"],
      currentUrl: input.sourceUrl,
    });

    const sourceSnapshot: SitePageSnapshot = {
      url: input.sourceUrl,
      title: input.sourceTitle ?? "Source Page",
      description: input.sourceDescription ?? "",
      h1: editorial.h1,
      h2s: editorial.h2s,
      headings: editorial.headings,
      images: [],
      bodyText: editorial.bodyText,
      contentSections: editorial.contentSections,
      contentDebug: editorial.contentDebug,
      existingInternalLinks: editorial.existingInternalLinks,
      canonical: null,
      robots: null,
      indexable: true,
      statusCode: 200,
      contentType: "text/html",
      hasJsonLd: false,
    };

    const targetSnapshots = input.targets.map(buildTargetSnapshot);
    const report = findLinkOpportunities([sourceSnapshot, ...targetSnapshots], 50);
    const targetProfiles = analyseSiteTopics(targetSnapshots);
    const sourceDebug = report.debug.find((entry) => entry.sourceUrl === input.sourceUrl);

    const result: InternalLinkHarnessResult = {
      extractedContentSummary: {
        sourceUrl: input.sourceUrl,
        selectedContentSelector: editorial.contentDebug.selectedContentSelector,
        paragraphCount: editorial.contentDebug.paragraphCount,
        extractedChunkCount: editorial.contentDebug.extractedBlockCount,
        firstFiveTextChunks: editorial.contentDebug.firstExtractedTextChunks,
        headingCounts: editorial.contentDebug.headingCounts,
        extractedHeadings: editorial.contentDebug.headingTexts,
        contextualBodyLinks: editorial.contentDebug.contextualBodyLinks,
      },
      targetPhraseList: targetProfiles.map((profile) => ({
        targetUrl: profile.url,
        targetTitle: profile.title,
        phrases: profile.topicPhrases.map((phrase) => phrase.phrase),
      })),
      matchedChunks:
        sourceDebug?.targetEvaluations.map((evaluation) => ({
          targetUrl: evaluation.targetUrl,
          snippets: evaluation.matchedSnippets,
        })) ?? [],
      opportunitiesFound: report.opportunities.filter(
        (opportunity) => opportunity.sourceUrl === input.sourceUrl,
      ),
      rejectionReasons:
        sourceDebug?.targetEvaluations.map((evaluation) => ({
          targetUrl: evaluation.targetUrl,
          decision: evaluation.decision,
          reasons: evaluation.reasons,
          matchedSnippets: evaluation.matchedSnippets,
        })) ?? [],
    };

    if (input.debugMode) {
      logInternalLinkHarnessResult(result);
    }

    return result;
  } finally {
    await browser.close();
  }
}

export async function runControlledInternalLinkTruthTest(
  input: ControlledInternalLinkHarnessInput,
): Promise<InternalLinkHarnessResult> {
  return runInternalLinkingDebugHarness({
    sourceHtml: input.sourceHtml,
    sourceUrl: input.sourceUrl,
    sourceTitle: input.sourceTitle,
    targets: [
      {
        url: input.targetUrl,
        title: input.targetTitle,
        h1: input.targetH1,
        h2s: input.targetH2s ?? [],
      },
    ],
    debugMode: input.debugMode,
  });
}
