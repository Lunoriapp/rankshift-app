import type { SitePageSnapshot } from "../crawler";

import { analyseSiteTopics } from "./analyseSiteTopics";
import { scoreOpportunity } from "./scoreOpportunity";
import type { OpportunityScore } from "./scoreOpportunity";
import { buildSnippet, normalizePhrase, phraseWordOverlap, tokenize } from "./shared";
import { suggestAnchorText } from "./suggestAnchorText";
import { normalizeAnchorTextForCompare, normalizeUrlForCompare } from "./urlCompare";
import type {
  InternalLinkDebugEntry,
  InternalLinkOpportunity,
  InternalLinkingReport,
  SitePageTopicProfile,
} from "./types";

interface FindLinkOpportunitiesOptions {
  sourceUrl?: string;
}

interface RewriteStrength {
  confidence: InternalLinkOpportunity["confidence"];
  confidenceScore: number;
}

function buildOpportunityId(sourceUrl: string, targetUrl: string, anchor: string | null): string {
  const base = `${sourceUrl}|${targetUrl}|${anchor || "rewrite"}`
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `internal-link-${base}`.slice(0, 140);
}

function normalizeComparableUrl(url: string): string {
  return normalizeUrlForCompare(url) ?? url.trim().toLowerCase();
}

function inferBrandCandidates(pages: SitePageTopicProfile[]): Set<string> {
  const candidates = new Set<string>();

  const byPathDepth = [...pages].sort((a, b) => {
    const aDepth = new URL(a.url).pathname.split("/").filter(Boolean).length;
    const bDepth = new URL(b.url).pathname.split("/").filter(Boolean).length;
    return aDepth - bDepth;
  });
  const homepage = byPathDepth.find((page) => new URL(page.url).pathname === "/") ?? byPathDepth[0];

  const pushCandidate = (value: string) => {
    const normalized = normalizeAnchorTextForCompare(value);

    if (!normalized || normalized.length < 3 || normalized.split(" ").length > 5) {
      return;
    }

    candidates.add(normalized);
  };

  if (homepage) {
    const homepageTitleLead = homepage.title.split(/[|:-]/)[0] ?? homepage.title;
    pushCandidate(homepageTitleLead);
    pushCandidate(homepage.h1);
    pushCandidate(homepage.primaryTopic);
  }

  if (pages[0]) {
    try {
      const host = new URL(pages[0].url).hostname.replace(/^www\./i, "");
      const rootLabel = host.split(".")[0]?.replace(/[-_]+/g, " ") ?? "";
      pushCandidate(rootLabel);
    } catch {
      // ignore bad url
    }
  }

  return candidates;
}

function isAboutTarget(url: string): boolean {
  try {
    return /\/about(?:[-_/]|$)/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function isHomepageTarget(url: string): boolean {
  try {
    return new URL(url).pathname === "/";
  } catch {
    return false;
  }
}

function isBrandAnchor(anchor: string | null, brandCandidates: Set<string>): boolean {
  if (!anchor) {
    return false;
  }

  const normalized = normalizeAnchorTextForCompare(anchor);

  if (!normalized) {
    return false;
  }

  if (brandCandidates.has(normalized)) {
    return true;
  }

  return [...brandCandidates].some((brand) => {
    if (brand.length < 4) {
      return false;
    }

    return normalized === brand || normalized.includes(`${brand} `) || normalized.includes(` ${brand}`);
  });
}

function sourceAlreadyLinksToTarget(
  source: SitePageTopicProfile,
  targetUrl: string,
): boolean {
  const normalizedTarget = normalizeUrlForCompare(targetUrl);
  return Boolean(
    normalizedTarget && source.existingInternalLinkTargets.includes(normalizedTarget),
  );
}

function sourceAlreadyLinksAnchorToTarget(
  source: SitePageTopicProfile,
  targetUrl: string,
  anchor: string,
): boolean {
  const normalizedTarget = normalizeUrlForCompare(targetUrl);
  const normalizedAnchor = normalizeAnchorTextForCompare(anchor);

  if (!normalizedTarget || !normalizedAnchor) {
    return false;
  }

  return source.existingInternalLinkEntries.some(
    (entry) =>
      entry.normalizedUrl === normalizedTarget &&
      entry.normalizedAnchorText === normalizedAnchor,
  );
}

function sourceHasLinkedAnchorPhrase(source: SitePageTopicProfile, anchor: string): boolean {
  const normalizedAnchor = normalizeAnchorTextForCompare(anchor);

  if (!normalizedAnchor) {
    return false;
  }

  return source.existingInternalLinkEntries.some(
    (entry) => entry.normalizedAnchorText === normalizedAnchor,
  );
}

function getPairSkipReason(
  source: SitePageTopicProfile,
  target: SitePageTopicProfile,
): string | null {
  if (source.url === target.url) {
    return "Skipped because source and target are the same page.";
  }

  if (sourceAlreadyLinksToTarget(source, target.url)) {
    return "Skipped: source already links to target.";
  }

  if (!source.indexable || !target.indexable) {
    return "Skipped because source or target is not indexable.";
  }

  const blockedTargetPathFragments = ["/404", "/not-found", "/error", "/page-not-found"];
  const targetPath = new URL(target.url).pathname.toLowerCase();
  if (blockedTargetPathFragments.some((fragment) => targetPath.includes(fragment))) {
    return "Skipped because target path is blocked.";
  }

  return null;
}

const GENERIC_TOPIC_TOKENS = new Set([
  "guide",
  "guides",
  "service",
  "services",
  "blog",
  "article",
  "overview",
  "information",
  "help",
  "legal",
  "law",
  "family",
  "team",
  "support",
  "advice",
  "solution",
  "solutions",
  "page",
]);

function hasStrongSourceTargetTopicFit(
  source: SitePageTopicProfile,
  target: SitePageTopicProfile,
): boolean {
  const sourceTitleCore =
    source.topicPhrases.find((phrase) => phrase.source === "title")?.phrase ?? "";
  const targetTitleCore =
    target.topicPhrases.find((phrase) => phrase.source === "title")?.phrase ?? "";
  const sourceTokens = new Set(tokenize(`${sourceTitleCore} ${source.h1} ${source.primaryTopic}`));
  const targetTokens = new Set(tokenize(`${targetTitleCore} ${target.h1} ${target.primaryTopic}`));

  if (sourceTokens.size === 0 || targetTokens.size === 0) {
    return true;
  }

  const overlap = [...sourceTokens].filter((token) => targetTokens.has(token));

  if (overlap.length >= 2) {
    return true;
  }

  if (overlap.some((token) => !GENERIC_TOPIC_TOKENS.has(token))) {
    return true;
  }

  const sourceTitleSignals = source.topicPhrases
    .filter((phrase) => phrase.source === "title" || phrase.source === "h1")
    .slice(0, 6);
  const targetSignalText = `${targetTitleCore} ${target.h1} ${target.primaryTopic}`;

  return sourceTitleSignals.some(
    (phrase) => phraseWordOverlap(targetSignalText, phrase.phrase) >= 0.8,
  );
}

function buildPlacementHint(sectionLabel: string, anchor: string): string {
  if (sectionLabel.toLowerCase().includes("introduction")) {
    return `Opening copy: link \"${anchor}\" where it first appears.`;
  }

  return `Paragraph under \"${sectionLabel}\".`;
}

function buildRewriteSuggestion(source: SitePageTopicProfile, target: SitePageTopicProfile): string {
  return `Rewrite a sentence on "${source.title}" to include a natural contextual mention of "${target.title}" and link it to ${target.url}.`;
}

function buildReason(
  sourceTitle: string,
  targetTitle: string,
  anchor: string | null,
  scored: OpportunityScore,
): string {
  if (!anchor) {
    return `No strong unlinked anchor phrase was found in the current copy, but ${sourceTitle} and ${targetTitle} are strongly related.`;
  }

  return `\"${anchor}\" strongly aligns with ${sourceTitle} and points naturally to ${targetTitle}; topic fit ${Math.round(scored.signals.targetTopicAlignment * 100)}%, source-theme fit ${Math.round(scored.signals.sourceTopicAlignment * 100)}%.`;
}

function anchorAffinity(anchor: string | null, targetUrl: string, targetTitle: string): number {
  if (!anchor) {
    return -1;
  }

  const anchorTokens = new Set(tokenize(anchor));
  if (anchorTokens.size === 0) {
    return 0;
  }

  const targetSignals = `${new URL(targetUrl).pathname} ${targetTitle}`;
  const targetTokens = new Set(tokenize(targetSignals));
  const overlap = [...anchorTokens].filter((token) => targetTokens.has(token)).length;

  return overlap;
}

function isBetterAnchorCandidate(
  next: InternalLinkOpportunity,
  current: InternalLinkOpportunity,
): boolean {
  if (Boolean(next.suggestedAnchor) !== Boolean(current.suggestedAnchor)) {
    return Boolean(next.suggestedAnchor);
  }

  if (next.confidenceScore !== current.confidenceScore) {
    return next.confidenceScore > current.confidenceScore;
  }

  const nextAffinity = anchorAffinity(next.suggestedAnchor, next.targetUrl, next.targetTitle);
  const currentAffinity = anchorAffinity(
    current.suggestedAnchor,
    current.targetUrl,
    current.targetTitle,
  );

  if (nextAffinity !== currentAffinity) {
    return nextAffinity > currentAffinity;
  }

  return next.targetTitle.length > current.targetTitle.length;
}

function hasUsableAnchor(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  const normalized = normalizeAnchorTextForCompare(value);

  return normalized.length > 0 && normalized !== "related page link";
}

function rewriteStrengthForPair(
  source: SitePageTopicProfile,
  target: SitePageTopicProfile,
): RewriteStrength | null {
  const relatedness = topicOverlapScore(source, target);

  if (relatedness >= 56) {
    return { confidence: "High", confidenceScore: 82 };
  }

  if (relatedness >= 38) {
    return { confidence: "Medium", confidenceScore: 68 };
  }

  return null;
}

function qualityScore(
  opportunity: InternalLinkOpportunity,
  source: SitePageTopicProfile | undefined,
  target: SitePageTopicProfile | undefined,
  brandCandidates: Set<string>,
): number {
  const base = opportunity.confidenceScore;
  const anchor = opportunity.suggestedAnchor;
  const nonBrandBonus =
    hasUsableAnchor(anchor) && !isBrandAnchor(anchor, brandCandidates) ? 10 : 0;
  const topicalAnchorBonus = hasUsableAnchor(anchor) ? Math.min(12, anchorAffinity(anchor, opportunity.targetUrl, opportunity.targetTitle) * 4) : 0;
  const sourceTargetThemeBonus =
    source && target ? Math.min(12, Math.round(topicOverlapScore(source, target) * 0.18)) : 0;
  const rewritePenalty = hasUsableAnchor(anchor) ? 0 : -8;

  return base + nonBrandBonus + topicalAnchorBonus + sourceTargetThemeBonus + rewritePenalty;
}

function topicOverlapScore(source: SitePageTopicProfile, target: SitePageTopicProfile): number {
  const sourceTokens = new Set<string>([
    ...tokenize(source.primaryTopic),
    ...source.keywords,
    ...source.topicPhrases.slice(0, 8).flatMap((phrase) => tokenize(phrase.phrase)),
  ]);
  const targetTokens = new Set<string>([
    ...tokenize(target.primaryTopic),
    ...target.keywords,
    ...target.topicPhrases.slice(0, 8).flatMap((phrase) => tokenize(phrase.phrase)),
  ]);

  if (sourceTokens.size === 0 || targetTokens.size === 0) {
    return 0;
  }

  const overlap = [...targetTokens].filter((token) => sourceTokens.has(token)).length;
  return Math.round((overlap / Math.max(1, Math.min(sourceTokens.size, targetTokens.size))) * 100);
}

function inferRecommendationType(
  source: SitePageTopicProfile,
  target: SitePageTopicProfile,
): NonNullable<InternalLinkOpportunity["recommendationType"]> {
  const sourcePath = normalizePhrase(new URL(source.url).pathname);
  const targetPath = normalizePhrase(new URL(target.url).pathname);

  if (targetPath.includes("service") || targetPath.includes("solution")) {
    return "related service";
  }

  if (
    targetPath.includes("contact") ||
    targetPath.includes("book") ||
    targetPath.includes("quote") ||
    targetPath.includes("pricing")
  ) {
    return "next-step page";
  }

  if (sourcePath.includes("location") || targetPath.includes("location")) {
    return "location/service related page";
  }

  if (targetPath.includes("blog") || targetPath.includes("guide") || targetPath.includes("faq")) {
    return "supporting information";
  }

  return "nearby topic";
}

function buildRelatedCandidates(
  source: SitePageTopicProfile,
  pages: SitePageTopicProfile[],
): InternalLinkOpportunity[] {
  const isBroadlyEligible = (target: SitePageTopicProfile): boolean => {
    if (source.url === target.url) {
      return false;
    }

    if (!target.indexable) {
      return false;
    }

    const blockedTargetPathFragments = ["/404", "/not-found", "/error", "/page-not-found"];
    const targetPath = new URL(target.url).pathname.toLowerCase();
    return !blockedTargetPathFragments.some((fragment) => targetPath.includes(fragment));
  };

  const strictCandidates = pages.filter((target) => getPairSkipReason(source, target) === null);
  const candidatePool = strictCandidates.length > 0 ? strictCandidates : pages.filter(isBroadlyEligible);

  const ranked = candidatePool
    .map((target) => ({
      target,
      score: topicOverlapScore(source, target),
    }))
    .sort((a, b) => b.score - a.score);

  const aboveThreshold = ranked.filter((entry) => entry.score >= 12);
  const selected = (aboveThreshold.length > 0 ? aboveThreshold : ranked).slice(0, 3);

  return selected
    .map(({ target }) => {
      const rewriteStrength = rewriteStrengthForPair(source, target);

      if (!rewriteStrength) {
        return null;
      }

      const candidate: InternalLinkOpportunity = {
        id: buildOpportunityId(source.url, target.url, null),
        sourceUrl: source.url,
        sourceTitle: source.title,
        targetUrl: target.url,
        targetTitle: target.title,
        suggestedAnchor: null,
        rewriteSuggestion: buildRewriteSuggestion(source, target),
        matchedSnippet: "No strong inline anchor was found in body text.",
        placementHint:
          "No strong anchor found. Suggested rewrite available.",
        reason:
          "No strong unlinked anchor phrase was found in current copy. A rewrite is suggested to add a natural contextual link.",
        confidence: rewriteStrength.confidence,
        confidenceScore: rewriteStrength.confidenceScore,
        status: "open",
        category: "Internal linking",
        opportunityType: "related",
        recommendationType: inferRecommendationType(source, target),
      };

      return candidate;
    })
    .filter((candidate): candidate is InternalLinkOpportunity => candidate !== null);
}

function buildDebugEntry(
  source: SitePageTopicProfile,
  targetEvaluations: InternalLinkDebugEntry["targetEvaluations"],
  opportunitiesFound: number,
): InternalLinkDebugEntry {
  const extractedTopicTerms = Array.from(
    new Set([
      ...tokenize(source.title),
      ...tokenize(source.h1),
      ...tokenize(source.primaryTopic),
      ...source.topicPhrases.slice(0, 8).flatMap((phrase) => tokenize(phrase.phrase)),
    ]),
  ).slice(0, 20);

  return {
    sourceUrl: source.url,
    sourceTitle: source.title,
    sourcePrimaryTopic: source.primaryTopic,
    extractedTopicTerms,
    selectedContentSelector: source.contentDebug.selectedContentSelector,
    paragraphCount: source.contentDebug.paragraphCount,
    extractedChunkCount: source.contentDebug.extractedBlockCount,
    firstExtractedTextChunks: source.contentDebug.firstExtractedTextChunks,
    fallbackStrategyUsed: source.contentDebug.fallbackStrategyUsed,
    headingCounts: source.contentDebug.headingCounts,
    headingTexts: source.contentDebug.headingTexts,
    hasMultipleVisibleH1: source.contentDebug.hasMultipleVisibleH1,
    contextualBodyLinks: source.contentDebug.contextualBodyLinks,
    candidateTargetPagesConsidered: targetEvaluations.length,
    opportunitiesFound,
    targetEvaluations,
  };
}

export function findLinkOpportunities(
  pages: SitePageSnapshot[],
  maxOpportunities = 24,
  options: FindLinkOpportunitiesOptions = {},
): InternalLinkingReport {
  const topicProfiles = analyseSiteTopics(pages);
  const brandCandidates = inferBrandCandidates(topicProfiles);
  const sourceUrlFilter = options.sourceUrl ? normalizeComparableUrl(options.sourceUrl) : null;
  const debug: InternalLinkDebugEntry[] = [];
  const suggestions: InternalLinkOpportunity[] = [];
  const seen = new Set<string>();
  let brandAnchorSuggestionsAccepted = 0;

  const diagnostics: NonNullable<InternalLinkingReport["diagnostics"]> = {
    pagesInput: pages.length,
    pagesWithUsableContent: pages.filter(
      (page) => page.indexable && page.bodyText.length >= 80 && page.contentSections.length > 0,
    ).length,
    internalLinksExtracted: pages.reduce((sum, page) => sum + page.existingInternalLinks.length, 0),
    candidateSourcePages: topicProfiles.length,
    candidateDestinationPages: topicProfiles.length,
    contextsEvaluated: 0,
    pairEvaluations: 0,
    rawBodyAnchorMatchesFound: 0,
    rawAcceptedCandidates: 0,
    droppedByFilter: {
      contentLength: 0,
      samePage: 0,
      alreadyLinked: 0,
      canonicalTarget: 0,
      samePrimaryTopic: 0,
      notIndexable: 0,
      anchorMatchOrSimilarity: 0,
      fallbackAnchor: 0,
      shortAnchor: 0,
      lowScore: 0,
    },
    duplicateCandidatesRemoved: 0,
    removedByPerSourceCap: 0,
    removedByGlobalCap: 0,
    relatedCandidatesGenerated: 0,
    relatedSelected: 0,
    finalOpportunities: 0,
  };

  for (const source of topicProfiles) {
    if (sourceUrlFilter && normalizeComparableUrl(source.url) !== sourceUrlFilter) {
      continue;
    }

    const targetEvaluations: InternalLinkDebugEntry["targetEvaluations"] = [];
    let sourceOpportunities = 0;
    const blockedSourceAnchors = new Set(
      source.existingInternalLinkEntries.map((entry) => entry.normalizedAnchorText),
    );
    const preferredSourcePhrases = [
      ...source.topicPhrases
        .filter((phrase) => phrase.source === "title" || phrase.source === "h1")
        .slice(0, 10),
      {
        phrase: source.primaryTopic,
        source: "h1" as const,
        weight: 1,
      },
    ];

    for (const target of topicProfiles) {
      diagnostics.pairEvaluations += 1;
      const skipReason = getPairSkipReason(source, target);
      const alreadyLinked = sourceAlreadyLinksToTarget(source, target.url);

      if (skipReason) {
        if (source.url === target.url) {
          diagnostics.droppedByFilter.samePage += 1;
        } else if (alreadyLinked) {
          diagnostics.droppedByFilter.alreadyLinked += 1;
        } else if (!source.indexable || !target.indexable) {
          diagnostics.droppedByFilter.notIndexable += 1;
        }

        targetEvaluations.push({
          targetUrl: target.url,
          targetTitle: target.title,
          candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
          candidateAnchorPhrases: [],
          existingContextualBodyLink: alreadyLinked,
          matchedSnippets: [],
          decision: "skipped",
          reasons: [skipReason],
        });
        continue;
      }

      if (!hasStrongSourceTargetTopicFit(source, target)) {
        targetEvaluations.push({
          targetUrl: target.url,
          targetTitle: target.title,
          candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
          candidateAnchorPhrases: [],
          existingContextualBodyLink: alreadyLinked,
          matchedSnippets: [],
          decision: "skipped",
          reasons: [
            "Skipped because target topic does not sufficiently align with the source page title/H1 theme.",
          ],
        });
        diagnostics.droppedByFilter.anchorMatchOrSimilarity += 1;
        continue;
      }

      let matched = false;
      const rejectedReasons: string[] = [];
      const candidateAnchorPhrases: InternalLinkDebugEntry["targetEvaluations"][number]["candidateAnchorPhrases"] =
        [];
      let winningCandidate: {
        contextText: string;
        sectionLabel: string;
        anchor: string;
        matchType: "exact" | "close" | "fallback";
        scored: OpportunityScore;
      } | null = null;

      for (const context of source.bodyContexts) {
        diagnostics.contextsEvaluated += 1;

        if (context.text.length < 28) {
          diagnostics.droppedByFilter.contentLength += 1;
          continue;
        }

        const suggestion = suggestAnchorText(context.text, target, {
          preferredPhrases: preferredSourcePhrases,
          blockedAnchors: blockedSourceAnchors,
          brandCandidates,
        });

        if (!suggestion) {
          diagnostics.droppedByFilter.anchorMatchOrSimilarity += 1;
          continue;
        }

        if (suggestion.matchType === "fallback") {
          rejectedReasons.push(
            `Rejected context under \"${context.sectionLabel}\" because only a fallback anchor was available, not a natural body mention.`,
          );
          diagnostics.droppedByFilter.fallbackAnchor += 1;
          continue;
        }

        if (suggestion.anchor.length < 4) {
          diagnostics.droppedByFilter.shortAnchor += 1;
          continue;
        }

        if (sourceHasLinkedAnchorPhrase(source, suggestion.anchor)) {
          diagnostics.droppedByFilter.alreadyLinked += 1;
          continue;
        }

        diagnostics.rawBodyAnchorMatchesFound += 1;
        const scored = scoreOpportunity({
          source,
          target,
          context,
          suggestion,
        });
        const sourceFit = scored.signals.sourceTopicAlignment;
        const targetFit = scored.signals.targetTopicAlignment;
        const combinedFit = sourceFit * 0.45 + targetFit * 0.55;
        const minScoreByMatchType = suggestion.matchType === "exact" ? 56 : 60;

        if (targetFit < 0.2 || combinedFit < 0.26) {
          diagnostics.droppedByFilter.lowScore += 1;
          candidateAnchorPhrases.push({
            anchor: suggestion.anchor,
            matchType: suggestion.matchType,
            sectionLabel: context.sectionLabel,
            score: scored.score,
            confidence: scored.confidence,
            reason: `Rejected for weak topical fit (source ${Math.round(sourceFit * 100)}%, target ${Math.round(targetFit * 100)}%, combined ${Math.round(combinedFit * 100)}%).`,
          });
          continue;
        }

        if (scored.score < minScoreByMatchType) {
          diagnostics.droppedByFilter.lowScore += 1;
          candidateAnchorPhrases.push({
            anchor: suggestion.anchor,
            matchType: suggestion.matchType,
            sectionLabel: context.sectionLabel,
            score: scored.score,
            confidence: scored.confidence,
            reason: `Rejected because score ${scored.score} is below minimum ${minScoreByMatchType}.`,
          });
          continue;
        }

        candidateAnchorPhrases.push({
          anchor: suggestion.anchor,
          matchType: suggestion.matchType,
          sectionLabel: context.sectionLabel,
          score: scored.score,
          confidence: scored.confidence,
          reason: `Kept candidate with strong source and target alignment.`,
        });

        if (!winningCandidate || scored.score > winningCandidate.scored.score) {
          winningCandidate = {
            contextText: context.text,
            sectionLabel: context.sectionLabel,
            anchor: suggestion.anchor,
            matchType: suggestion.matchType,
            scored,
          };
        }
      }

      if (winningCandidate) {
        const snippet = buildSnippet(winningCandidate.contextText, winningCandidate.anchor);
        const key = `${source.url}|${target.url}|${normalizePhrase(winningCandidate.anchor)}`;
        const alreadyLinkedToTarget = sourceAlreadyLinksToTarget(source, target.url);
        const alreadyLinkedWithSameAnchor = sourceAlreadyLinksAnchorToTarget(
          source,
          target.url,
          winningCandidate.anchor,
        );
        const isBrand = isBrandAnchor(winningCandidate.anchor, brandCandidates);
        const brandAnchorAllowed =
          isBrand &&
          (isHomepageTarget(target.url) || isAboutTarget(target.url)) &&
          winningCandidate.scored.confidence === "High" &&
          !alreadyLinkedToTarget &&
          brandAnchorSuggestionsAccepted === 0;

        if (seen.has(key)) {
          diagnostics.duplicateCandidatesRemoved += 1;
          targetEvaluations.push({
            targetUrl: target.url,
            targetTitle: target.title,
            candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
            candidateAnchorPhrases: candidateAnchorPhrases
              .sort((a, b) => b.score - a.score)
              .slice(0, 12),
            existingContextualBodyLink: alreadyLinkedToTarget,
            matchedSnippets: [snippet],
            decision: "rejected",
            reasons: ["Best contextual candidate duplicated an existing source/target/anchor match."],
          });
          continue;
        }

        if (alreadyLinkedToTarget || alreadyLinkedWithSameAnchor) {
          diagnostics.droppedByFilter.alreadyLinked += 1;
          targetEvaluations.push({
            targetUrl: target.url,
            targetTitle: target.title,
            candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
            candidateAnchorPhrases: candidateAnchorPhrases
              .sort((a, b) => b.score - a.score)
              .slice(0, 12),
            existingContextualBodyLink: alreadyLinkedToTarget,
            matchedSnippets: [snippet],
            decision: "skipped",
            reasons: [
              alreadyLinkedWithSameAnchor
                ? "Skipped: source already links this anchor phrase to the target."
                : "Skipped: source already links to target.",
            ],
          });
          continue;
        }

        if (isBrand && !brandAnchorAllowed) {
          diagnostics.droppedByFilter.anchorMatchOrSimilarity += 1;
          targetEvaluations.push({
            targetUrl: target.url,
            targetTitle: target.title,
            candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
            candidateAnchorPhrases: candidateAnchorPhrases
              .sort((a, b) => b.score - a.score)
              .slice(0, 12),
            existingContextualBodyLink: alreadyLinkedToTarget,
            matchedSnippets: [snippet],
            decision: "rejected",
            reasons: [
              "Rejected brand anchor because it did not pass homepage/about/high-confidence non-duplicate policy.",
            ],
          });
          continue;
        }

        seen.add(key);
        suggestions.push({
          id: buildOpportunityId(source.url, target.url, winningCandidate.anchor),
          sourceUrl: source.url,
          sourceTitle: source.title,
          targetUrl: target.url,
          targetTitle: target.title,
          suggestedAnchor: winningCandidate.anchor,
          rewriteSuggestion: null,
          matchedSnippet: snippet,
          placementHint: buildPlacementHint(winningCandidate.sectionLabel, winningCandidate.anchor),
          reason: buildReason(source.title, target.title, winningCandidate.anchor, winningCandidate.scored),
          confidence: winningCandidate.scored.confidence,
          confidenceScore: winningCandidate.scored.score,
          status: "open",
          category: "Internal linking",
          opportunityType: "contextual",
        });
        if (isBrand) {
          brandAnchorSuggestionsAccepted += 1;
        }

        sourceOpportunities += 1;
        diagnostics.rawAcceptedCandidates += 1;
        targetEvaluations.push({
          targetUrl: target.url,
          targetTitle: target.title,
          candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
          candidateAnchorPhrases: candidateAnchorPhrases
            .sort((a, b) => b.score - a.score)
            .slice(0, 12),
          existingContextualBodyLink: alreadyLinkedToTarget,
          matchedSnippets: [snippet],
          decision: "accepted",
          reasons: [
            `Accepted best candidate under \"${winningCandidate.sectionLabel}\" with ${winningCandidate.scored.confidence} confidence and score ${winningCandidate.scored.score}.`,
          ],
        });

        matched = true;
      }

      if (!matched) {
        const rewriteSuggestion = buildRewriteSuggestion(source, target);
        const rewriteStrength = rewriteStrengthForPair(source, target);
        const rewriteKey = `${source.url}|${target.url}|rewrite`;

        if (
          rewriteStrength &&
          !seen.has(rewriteKey) &&
          !sourceAlreadyLinksToTarget(source, target.url)
        ) {
          seen.add(rewriteKey);
          suggestions.push({
            id: buildOpportunityId(source.url, target.url, null),
            sourceUrl: source.url,
            sourceTitle: source.title,
            targetUrl: target.url,
            targetTitle: target.title,
            suggestedAnchor: null,
            rewriteSuggestion,
            matchedSnippet:
              source.contentDebug.firstExtractedTextChunks[0] ??
              "No strong unlinked anchor phrase was found in source copy.",
            placementHint: "No strong anchor found. Suggested rewrite available.",
            reason: buildReason(source.title, target.title, null, {
              score: rewriteStrength.confidenceScore,
              confidence: rewriteStrength.confidence,
              signals: {
                sourceTopicAlignment: 0.62,
                targetTopicAlignment: 0.62,
                sourceTargetAlignment: 0.64,
                sectionRelevance: 0.7,
                topOfPageWeight: 0.7,
                anchorNaturalness: 0,
              },
            }),
            confidence: rewriteStrength.confidence,
            confidenceScore: rewriteStrength.confidenceScore,
            status: "open",
            category: "Internal linking",
            opportunityType: "contextual",
          });
        }

        targetEvaluations.push({
          targetUrl: target.url,
          targetTitle: target.title,
          candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
          candidateAnchorPhrases: candidateAnchorPhrases
            .sort((a, b) => b.score - a.score)
            .slice(0, 12),
          existingContextualBodyLink: sourceAlreadyLinksToTarget(source, target.url),
          matchedSnippets: [],
          decision: "rejected",
          reasons:
            rejectedReasons.length > 0
              ? rejectedReasons
              : ["No strong contextual phrase match was found in source body copy."],
        });
      }
    }

    if (sourceOpportunities === 0) {
      const relatedCandidates = buildRelatedCandidates(source, topicProfiles);
      diagnostics.relatedCandidatesGenerated += relatedCandidates.length;

      for (const candidate of relatedCandidates) {
        const key = `${candidate.sourceUrl}|${candidate.targetUrl}|related`;

        if (seen.has(key)) {
          diagnostics.duplicateCandidatesRemoved += 1;
          continue;
        }

        seen.add(key);
        suggestions.push(candidate);
        diagnostics.relatedSelected += 1;
      }
    }

    debug.push(buildDebugEntry(source, targetEvaluations, sourceOpportunities));
  }

  const bestBySourceTarget = new Map<string, InternalLinkOpportunity>();

  for (const suggestion of suggestions) {
    const key = `${suggestion.sourceUrl}|${suggestion.targetUrl}`;
    const existing = bestBySourceTarget.get(key);

    if (!existing || suggestion.confidenceScore > existing.confidenceScore) {
      bestBySourceTarget.set(key, suggestion);
    }
  }

  const bestBySourceAnchor = new Map<string, InternalLinkOpportunity>();

  for (const suggestion of bestBySourceTarget.values()) {
    const anchorKey = `${suggestion.sourceUrl}|${
      hasUsableAnchor(suggestion.suggestedAnchor)
        ? normalizePhrase(suggestion.suggestedAnchor)
        : normalizePhrase(suggestion.rewriteSuggestion ?? `rewrite-${suggestion.targetUrl}`)
    }`;
    const existing = bestBySourceAnchor.get(anchorKey);

    if (!existing || isBetterAnchorCandidate(suggestion, existing)) {
      bestBySourceAnchor.set(anchorKey, suggestion);
    }
  }

  const sourceProfileByUrl = new Map(
    topicProfiles.map((profile) => [normalizeComparableUrl(profile.url), profile]),
  );
  const targetProfileByUrl = new Map(
    topicProfiles.map((profile) => [normalizeComparableUrl(profile.url), profile]),
  );
  const confidenceRank: Record<InternalLinkOpportunity["confidence"], number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };
  const sorted = [...bestBySourceAnchor.values()].sort((a, b) => {
    const sourceA = sourceProfileByUrl.get(normalizeComparableUrl(a.sourceUrl));
    const targetA = targetProfileByUrl.get(normalizeComparableUrl(a.targetUrl));
    const sourceB = sourceProfileByUrl.get(normalizeComparableUrl(b.sourceUrl));
    const targetB = targetProfileByUrl.get(normalizeComparableUrl(b.targetUrl));
    const qualityA = qualityScore(a, sourceA, targetA, brandCandidates);
    const qualityB = qualityScore(b, sourceB, targetB, brandCandidates);

    if (qualityA !== qualityB) {
      return qualityB - qualityA;
    }

    if (confidenceRank[a.confidence] !== confidenceRank[b.confidence]) {
      return confidenceRank[b.confidence] - confidenceRank[a.confidence];
    }

    return b.confidenceScore - a.confidenceScore;
  });
  const filteredByExistingLinks = sorted.filter((suggestion) => {
    const sourceProfile = sourceProfileByUrl.get(normalizeComparableUrl(suggestion.sourceUrl));

    if (!sourceProfile) {
      return true;
    }

    const alreadyLinkedToTarget = sourceAlreadyLinksToTarget(sourceProfile, suggestion.targetUrl);
    const alreadyLinkedWithSameAnchor =
      hasUsableAnchor(suggestion.suggestedAnchor) &&
      sourceAlreadyLinksAnchorToTarget(
        sourceProfile,
        suggestion.targetUrl,
        suggestion.suggestedAnchor,
      );
    const anchorAlreadyLinkedAnywhere =
      hasUsableAnchor(suggestion.suggestedAnchor) &&
      sourceHasLinkedAnchorPhrase(sourceProfile, suggestion.suggestedAnchor);

    if (alreadyLinkedToTarget || alreadyLinkedWithSameAnchor || anchorAlreadyLinkedAnywhere) {
      diagnostics.droppedByFilter.alreadyLinked += 1;
      return false;
    }

    return hasUsableAnchor(suggestion.suggestedAnchor) || Boolean(suggestion.rewriteSuggestion);
  });
  const finalOpportunities = filteredByExistingLinks.slice(0, maxOpportunities);
  diagnostics.duplicateCandidatesRemoved += Math.max(
    0,
    suggestions.length - bestBySourceTarget.size + (bestBySourceTarget.size - sorted.length),
  );
  diagnostics.removedByGlobalCap = Math.max(
    0,
    filteredByExistingLinks.length - finalOpportunities.length,
  );
  diagnostics.finalOpportunities = finalOpportunities.length;

  console.debug("[internal-linking][pipeline]", diagnostics);

  return {
    pages: topicProfiles,
    opportunities: finalOpportunities,
    scannedPageCount: pages.length,
    debug,
    diagnostics,
  };
}
