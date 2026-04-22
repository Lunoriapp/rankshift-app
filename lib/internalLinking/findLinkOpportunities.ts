import type { SitePageSnapshot } from "../crawler";

import { analyseSiteTopics } from "./analyseSiteTopics";
import { scoreOpportunity } from "./scoreOpportunity";
import type { OpportunityScore } from "./scoreOpportunity";
import { buildSnippet, normalizePhrase, phraseWordOverlap, tokenize } from "./shared";
import { suggestAnchorText } from "./suggestAnchorText";
import type {
  InternalLinkDebugEntry,
  InternalLinkOpportunity,
  InternalLinkingReport,
  SitePageTopicProfile,
} from "./types";

function buildOpportunityId(sourceUrl: string, targetUrl: string, anchor: string): string {
  const base = `${sourceUrl}|${targetUrl}|${anchor}`
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `internal-link-${base}`.slice(0, 140);
}

function shouldSkipPair(source: SitePageTopicProfile, target: SitePageTopicProfile): boolean {
  if (source.url === target.url) {
    return true;
  }

  const shouldEnforceExistingLinkSkip =
    source.contentDebug.selectedContentSelector !== "fetch-fallback";

  if (
    shouldEnforceExistingLinkSkip &&
    source.existingInternalLinkTargets.includes(target.url)
  ) {
    return true;
  }

  if (!source.indexable || !target.indexable) {
    return true;
  }

  const blockedTargetPathFragments = ["/404", "/not-found", "/error", "/page-not-found"];
  const targetPath = new URL(target.url).pathname.toLowerCase();
  if (blockedTargetPathFragments.some((fragment) => targetPath.includes(fragment))) {
    return true;
  }

  return false;
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
  const sourceTokens = new Set(tokenize(`${source.title} ${source.h1} ${source.primaryTopic}`));
  const targetTokens = new Set(tokenize(`${target.title} ${target.h1} ${target.primaryTopic}`));

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
  const targetSignalText = `${target.title} ${target.h1} ${target.primaryTopic}`;

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

function buildReason(
  sourceTitle: string,
  targetTitle: string,
  anchor: string,
  scored: OpportunityScore,
): string {
  return `\"${anchor}\" strongly aligns with ${sourceTitle} and points naturally to ${targetTitle}; topic fit ${Math.round(scored.signals.targetTopicAlignment * 100)}%, source-theme fit ${Math.round(scored.signals.sourceTopicAlignment * 100)}%.`;
}

function anchorAffinity(anchor: string, targetUrl: string, targetTitle: string): number {
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

  const strictCandidates = pages.filter((target) => !shouldSkipPair(source, target));
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
    .map(({ target, score }) => ({
      id: buildOpportunityId(source.url, target.url, `related-${score}`),
      sourceUrl: source.url,
      sourceTitle: source.title,
      targetUrl: target.url,
      targetTitle: target.title,
      suggestedAnchor: "Related page link",
      matchedSnippet: "No strong inline anchor was found in body text.",
      placementHint:
        "Add this link in a Related services, Further reading, or Useful next steps section.",
      reason:
        "No strong inline phrase match was found, but this page is clearly related and should still be linked for user flow and topical support.",
      confidence: score >= 56 ? "Medium" : "Low",
      confidenceScore: score >= 56 ? 60 : 48,
      status: "open",
      category: "Internal linking",
      opportunityType: "related",
      recommendationType: inferRecommendationType(source, target),
    }));
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
): InternalLinkingReport {
  const topicProfiles = analyseSiteTopics(pages);
  const debug: InternalLinkDebugEntry[] = [];
  const suggestions: InternalLinkOpportunity[] = [];
  const seen = new Set<string>();

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
    const targetEvaluations: InternalLinkDebugEntry["targetEvaluations"] = [];
    let sourceOpportunities = 0;

    for (const target of topicProfiles) {
      diagnostics.pairEvaluations += 1;

      if (shouldSkipPair(source, target)) {
        targetEvaluations.push({
          targetUrl: target.url,
          targetTitle: target.title,
          candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
          candidateAnchorPhrases: [],
          existingContextualBodyLink: source.existingInternalLinkTargets.includes(target.url),
          matchedSnippets: [],
          decision: "skipped",
          reasons: ["Skipped because source and target are the same page or already linked."],
        });
        continue;
      }

      if (!hasStrongSourceTargetTopicFit(source, target)) {
        targetEvaluations.push({
          targetUrl: target.url,
          targetTitle: target.title,
          candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
          candidateAnchorPhrases: [],
          existingContextualBodyLink: source.existingInternalLinkTargets.includes(target.url),
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

        const suggestion = suggestAnchorText(context.text, target);

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

        if (seen.has(key)) {
          diagnostics.duplicateCandidatesRemoved += 1;
          targetEvaluations.push({
            targetUrl: target.url,
            targetTitle: target.title,
            candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
            candidateAnchorPhrases: candidateAnchorPhrases
              .sort((a, b) => b.score - a.score)
              .slice(0, 12),
            existingContextualBodyLink: source.existingInternalLinkTargets.includes(target.url),
            matchedSnippets: [snippet],
            decision: "rejected",
            reasons: ["Best contextual candidate duplicated an existing source/target/anchor match."],
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
          matchedSnippet: snippet,
          placementHint: buildPlacementHint(winningCandidate.sectionLabel, winningCandidate.anchor),
          reason: buildReason(source.title, target.title, winningCandidate.anchor, winningCandidate.scored),
          confidence: winningCandidate.scored.confidence,
          confidenceScore: winningCandidate.scored.score,
          status: "open",
          category: "Internal linking",
          opportunityType: "contextual",
        });

        sourceOpportunities += 1;
        diagnostics.rawAcceptedCandidates += 1;
        targetEvaluations.push({
          targetUrl: target.url,
          targetTitle: target.title,
          candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
          candidateAnchorPhrases: candidateAnchorPhrases
            .sort((a, b) => b.score - a.score)
            .slice(0, 12),
          existingContextualBodyLink: source.existingInternalLinkTargets.includes(target.url),
          matchedSnippets: [snippet],
          decision: "accepted",
          reasons: [
            `Accepted best candidate under \"${winningCandidate.sectionLabel}\" with ${winningCandidate.scored.confidence} confidence and score ${winningCandidate.scored.score}.`,
          ],
        });

        matched = true;
      }

      if (!matched) {
        targetEvaluations.push({
          targetUrl: target.url,
          targetTitle: target.title,
          candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
          candidateAnchorPhrases: candidateAnchorPhrases
            .sort((a, b) => b.score - a.score)
            .slice(0, 12),
          existingContextualBodyLink: source.existingInternalLinkTargets.includes(target.url),
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
    const anchorKey = `${suggestion.sourceUrl}|${normalizePhrase(suggestion.suggestedAnchor)}`;
    const existing = bestBySourceAnchor.get(anchorKey);

    if (!existing || isBetterAnchorCandidate(suggestion, existing)) {
      bestBySourceAnchor.set(anchorKey, suggestion);
    }
  }

  const sorted = [...bestBySourceAnchor.values()].sort(
    (a, b) => b.confidenceScore - a.confidenceScore,
  );
  const finalOpportunities = sorted.slice(0, maxOpportunities);
  diagnostics.duplicateCandidatesRemoved += Math.max(
    0,
    suggestions.length - bestBySourceTarget.size + (bestBySourceTarget.size - sorted.length),
  );
  diagnostics.removedByGlobalCap = Math.max(0, sorted.length - finalOpportunities.length);
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
