import type { SitePageSnapshot } from "../crawler";

import { analyseSiteTopics } from "./analyseSiteTopics";
import { scoreOpportunity } from "./scoreOpportunity";
import { suggestAnchorText } from "./suggestAnchorText";
import type {
  InternalLinkDebugEntry,
  InternalLinkOpportunity,
  InternalLinkingReport,
  SiteContentContext,
  SitePageTopicProfile,
} from "./types";
import {
  buildSnippet,
  findClosePhraseMatches,
  findPhraseMatch,
  isWeakTopicPhrase,
  normalizePhrase,
  phraseWordOverlap,
} from "./shared";

interface RankedSnippetCandidate {
  context: SiteContentContext;
  target: SitePageTopicProfile;
  opportunity: InternalLinkOpportunity;
  matchedSnippet: string;
  reasons: string[];
}

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

  if (source.existingInternalLinkTargets.includes(target.url)) {
    return true;
  }

  if (source.canonicalUrl && source.canonicalUrl === target.url) {
    return true;
  }

  if (normalizePhrase(source.primaryTopic) === normalizePhrase(target.primaryTopic)) {
    return true;
  }

  return !source.indexable || !target.indexable;
}

function getSkipReason(source: SitePageTopicProfile, target: SitePageTopicProfile): string {
  if (source.url === target.url) {
    return "Skipped because source and target are the same page.";
  }

  if (source.existingInternalLinkTargets.includes(target.url)) {
    return "Skipped because a contextual body link to this target already exists.";
  }

  if (source.canonicalUrl && source.canonicalUrl === target.url) {
    return "Skipped because the target matches the source canonical URL.";
  }

  if (normalizePhrase(source.primaryTopic) === normalizePhrase(target.primaryTopic)) {
    return "Skipped because source and target appear to have the same primary topic.";
  }

  if (!source.indexable || !target.indexable) {
    return "Skipped because source or target is not indexable.";
  }

  return "Skipped by pair filter.";
}

function buildPlacementHint(context: SiteContentContext, anchor: string): string {
  if (context.sectionLabel === "Introduction") {
    return `Opening copy: add the link where "${anchor}" is already mentioned.`;
  }

  if (context.blockType === "list_item") {
    return `List item under "${context.sectionLabel}".`;
  }

  return `Paragraph under "${context.sectionLabel}".`;
}

function buildReason(
  source: SitePageTopicProfile,
  target: SitePageTopicProfile,
  anchor: string,
): string {
  return `${source.title} already mentions "${anchor}" but does not link users through to ${target.title}. Adding that link strengthens topical paths and helps visitors reach the more relevant page faster.`;
}

function collectMatchedSnippets(
  source: SitePageTopicProfile,
  target: SitePageTopicProfile,
): string[] {
  const snippets: string[] = [];

  for (const context of source.bodyContexts) {
    for (const phrase of target.topicPhrases) {
      if (isWeakTopicPhrase(phrase.phrase)) {
        continue;
      }

      const exact = findPhraseMatch(context.text, phrase.phrase);

      if (exact) {
        snippets.push(buildSnippet(context.text, exact));
        break;
      }

      if (phraseWordOverlap(context.text, phrase.phrase) >= 0.67) {
        const close = findClosePhraseMatches(context.text, phrase.phrase, 1)[0];

        if (close) {
          snippets.push(buildSnippet(context.text, close));
          break;
        }
      }
    }

    if (snippets.length >= 3) {
      break;
    }
  }

  return snippets;
}

function evaluateTargetForContext(
  source: SitePageTopicProfile,
  target: SitePageTopicProfile,
  context: SiteContentContext,
): {
  candidate: RankedSnippetCandidate | null;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (context.text.length < 32) {
    return {
      candidate: null,
      reasons: [
        `Rejected context under "${context.sectionLabel}" because the source chunk was too short for a reliable editorial mention.`,
      ],
    };
  }

  if (shouldSkipPair(source, target)) {
    return {
      candidate: null,
      reasons: [getSkipReason(source, target)],
    };
  }

  const suggestion = suggestAnchorText(context.text, target);

  if (!suggestion) {
    return {
      candidate: null,
      reasons: [
        `Rejected context under "${context.sectionLabel}" because no usable topic phrase match was found or the phrase match was too weak.`,
      ],
    };
  }

  if (suggestion.matchType === "fallback") {
    return {
      candidate: null,
      reasons: [
        `Rejected context under "${context.sectionLabel}" because only a fallback anchor was available, not a natural body mention.`,
      ],
    };
  }

  if (suggestion.anchor.length < 4) {
    return {
      candidate: null,
      reasons: [
        `Rejected context under "${context.sectionLabel}" because the matched anchor was too short.`,
      ],
    };
  }

  const matchedSnippet = buildSnippet(context.text, suggestion.anchor);
  const { score, confidence } = scoreOpportunity({
    source,
    target,
    context,
    suggestion,
  });

  if (score < 48) {
    return {
      candidate: null,
      reasons: [
        `Rejected context under "${context.sectionLabel}" because the score was ${score}, below the acceptance threshold.`,
      ],
    };
  }

  return {
    candidate: {
      context,
      target,
      matchedSnippet,
      reasons,
      opportunity: {
        id: buildOpportunityId(source.url, target.url, suggestion.anchor),
        sourceUrl: source.url,
        sourceTitle: source.title,
        targetUrl: target.url,
        targetTitle: target.title,
        suggestedAnchor: suggestion.anchor,
        matchedSnippet,
        placementHint: buildPlacementHint(context, suggestion.anchor),
        reason: buildReason(source, target, suggestion.anchor),
        confidence,
        confidenceScore: score,
        status: "open",
        category: "Internal linking",
      },
    },
      reasons: [
        `Accepted candidate under "${context.sectionLabel}" with ${confidence} confidence and score ${score}.`,
      ],
  };
}

function snippetKey(context: SiteContentContext): string {
  return `${normalizePhrase(context.sectionLabel)}|${normalizePhrase(buildSnippet(context.text, context.text.slice(0, 24), 180))}`;
}

function isClearlyDifferentConcept(
  primary: RankedSnippetCandidate,
  secondary: RankedSnippetCandidate,
): boolean {
  const primaryTopic = normalizePhrase(primary.target.primaryTopic);
  const secondaryTopic = normalizePhrase(secondary.target.primaryTopic);

  if (primaryTopic === secondaryTopic) {
    return false;
  }

  return normalizePhrase(primary.opportunity.suggestedAnchor) !==
    normalizePhrase(secondary.opportunity.suggestedAnchor);
}

function rankContextCandidates(
  source: SitePageTopicProfile,
  context: SiteContentContext,
  targets: SitePageTopicProfile[],
): {
  primary: RankedSnippetCandidate | null;
  secondary: RankedSnippetCandidate[];
  matchedSnippets: string[];
  reasonsByTarget: Map<string, string[]>;
} {
  const accepted: RankedSnippetCandidate[] = [];
  const reasonsByTarget = new Map<string, string[]>();

  for (const target of targets) {
    const result = evaluateTargetForContext(source, target, context);
    reasonsByTarget.set(target.url, result.reasons);

    if (result.candidate) {
      accepted.push(result.candidate);
    }
  }

  accepted.sort((a, b) => b.opportunity.confidenceScore - a.opportunity.confidenceScore);

  const primary = accepted[0] ?? null;
  const secondary = primary
    ? accepted
        .slice(1)
        .filter((candidate) => isClearlyDifferentConcept(primary, candidate))
        .filter(
          (candidate) =>
            primary.opportunity.confidenceScore - candidate.opportunity.confidenceScore <= 10,
        )
        .slice(0, 3)
    : [];

  return {
    primary,
    secondary,
    matchedSnippets: primary ? [primary.matchedSnippet] : [],
    reasonsByTarget,
  };
}

function mergeDuplicateSnippetRecommendations(
  candidates: Array<{
    primary: RankedSnippetCandidate;
    secondary: RankedSnippetCandidate[];
  }>,
): InternalLinkOpportunity[] {
  const bySnippet = new Map<
    string,
    {
      primary: RankedSnippetCandidate;
      secondary: RankedSnippetCandidate[];
    }
  >();

  for (const candidate of candidates) {
    const key = snippetKey(candidate.primary.context);
    const existing = bySnippet.get(key);

    if (
      !existing ||
      candidate.primary.opportunity.confidenceScore > existing.primary.opportunity.confidenceScore
    ) {
      bySnippet.set(key, candidate);
      continue;
    }

    const mergedSecondary = [...existing.secondary, candidate.primary, ...candidate.secondary]
      .sort((a, b) => b.opportunity.confidenceScore - a.opportunity.confidenceScore)
      .filter((item, index, list) => {
        const firstIndex = list.findIndex(
          (entry) => normalizePhrase(entry.target.url) === normalizePhrase(item.target.url),
        );
        return firstIndex === index;
      })
      .slice(0, 3);

    bySnippet.set(key, {
      primary: existing.primary,
      secondary: mergedSecondary,
    });
  }

  return [...bySnippet.values()].map(({ primary, secondary }) => ({
    ...primary.opportunity,
    otherPossibleMatches: secondary.map((item) => ({
      targetUrl: item.opportunity.targetUrl,
      targetTitle: item.opportunity.targetTitle,
      suggestedAnchor: item.opportunity.suggestedAnchor,
      confidence: item.opportunity.confidence,
      confidenceScore: item.opportunity.confidenceScore,
    })),
  }));
}

function buildDebugEntry(
  source: SitePageTopicProfile,
  opportunitiesFound: number,
  targetEvaluations: InternalLinkDebugEntry["targetEvaluations"],
): InternalLinkDebugEntry {
  return {
    sourceUrl: source.url,
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

function logDebugEntry(entry: InternalLinkDebugEntry) {
  console.debug(`[internal-linking] source=${entry.sourceUrl}`);
  console.debug(
    `[internal-linking] selector=${entry.selectedContentSelector} paragraphs=${entry.paragraphCount} chunks=${entry.extractedChunkCount} fallback=${entry.fallbackStrategyUsed}`,
  );
  console.debug(
    `[internal-linking] headings h1=${entry.headingCounts.h1} h2=${entry.headingCounts.h2} h3=${entry.headingCounts.h3} h4=${entry.headingCounts.h4}`,
  );
  console.debug(
    `[internal-linking] heading_texts h1=${entry.headingTexts.h1.join(" | ") || "(none)"}`,
  );
  console.debug(
    `[internal-linking] heading_texts h2=${entry.headingTexts.h2.join(" | ") || "(none)"}`,
  );
  console.debug(
    `[internal-linking] heading_texts h3=${entry.headingTexts.h3.join(" | ") || "(none)"}`,
  );
  console.debug(`[internal-linking] has_multiple_visible_h1=${entry.hasMultipleVisibleH1}`);
  console.debug(
    `[internal-linking] contextual_body_links=${entry.contextualBodyLinks
      .map((link) => `${link.text} -> ${link.href}`)
      .join(" || ") || "(none)"}`,
  );

  for (const [index, chunk] of entry.firstExtractedTextChunks.entries()) {
    console.debug(`[internal-linking] chunk_${index + 1}=${chunk}`);
  }

  console.debug(
    `[internal-linking] candidate_targets=${entry.candidateTargetPagesConsidered} opportunities=${entry.opportunitiesFound}`,
  );

  for (const evaluation of entry.targetEvaluations) {
    console.debug(
      `[internal-linking] target=${evaluation.targetUrl} existing_contextual_link=${evaluation.existingContextualBodyLink}`,
    );
    console.debug(
      `[internal-linking] target_phrases=${evaluation.candidatePhrases.join(" | ") || "(none)"}`,
    );
    console.debug(
      `[internal-linking] matched_snippets=${evaluation.matchedSnippets.join(" || ") || "(none)"}`,
    );
    console.debug(`[internal-linking] decision=${evaluation.decision}`);

    for (const reason of evaluation.reasons) {
      console.debug(`[internal-linking] reason=${reason}`);
    }
  }
}

export function findLinkOpportunities(
  pages: SitePageSnapshot[],
  maxOpportunities = 24,
): InternalLinkingReport {
  const topicProfiles = analyseSiteTopics(pages);
  const opportunities: InternalLinkOpportunity[] = [];
  const debug: InternalLinkDebugEntry[] = [];

  for (const source of topicProfiles) {
    const sourceSnippetRecommendations: Array<{
      primary: RankedSnippetCandidate;
      secondary: RankedSnippetCandidate[];
    }> = [];
    const targetEvaluations = new Map<
      string,
      InternalLinkDebugEntry["targetEvaluations"][number]
    >();

    for (const target of topicProfiles) {
      targetEvaluations.set(target.url, {
        targetUrl: target.url,
        targetTitle: target.title,
        candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
        existingContextualBodyLink: source.existingInternalLinkTargets.includes(target.url),
        matchedSnippets: [],
        decision: shouldSkipPair(source, target) ? "skipped" : "rejected",
        reasons: shouldSkipPair(source, target) ? [getSkipReason(source, target)] : [],
      });
    }

    for (const context of source.bodyContexts) {
      const result = rankContextCandidates(source, context, topicProfiles);

      for (const target of topicProfiles) {
        const evaluation = targetEvaluations.get(target.url);

        if (!evaluation) {
          continue;
        }

        const nextReasons = result.reasonsByTarget.get(target.url);

        if (nextReasons && nextReasons.length > 0) {
          evaluation.reasons.push(...nextReasons);
        }
      }

      if (!result.primary) {
        continue;
      }

      sourceSnippetRecommendations.push({
        primary: result.primary,
        secondary: result.secondary,
      });

      const primaryEvaluation = targetEvaluations.get(result.primary.target.url);

      if (primaryEvaluation) {
        primaryEvaluation.matchedSnippets = [result.primary.matchedSnippet];
        primaryEvaluation.decision = "accepted";
      }

      for (const secondary of result.secondary) {
        const secondaryEvaluation = targetEvaluations.get(secondary.target.url);

        if (!secondaryEvaluation) {
          continue;
        }

        secondaryEvaluation.matchedSnippets = [secondary.matchedSnippet];
        secondaryEvaluation.reasons.push(
          `Held as an alternate match for the same source snippet because a stronger primary target was chosen.`,
        );
      }
    }

    const mergedOpportunities = mergeDuplicateSnippetRecommendations(sourceSnippetRecommendations)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 4);

    for (const opportunity of mergedOpportunities) {
      if (!opportunities.find((item) => item.id === opportunity.id)) {
        opportunities.push(opportunity);
      }
    }

    const targetEvaluationList = [...targetEvaluations.values()];
    const debugEntry = buildDebugEntry(
      source,
      mergedOpportunities.length,
      targetEvaluationList,
    );
    debug.push(debugEntry);
    logDebugEntry(debugEntry);
  }

  const sortedOpportunities = opportunities
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, maxOpportunities);

  return {
    pages: topicProfiles,
    opportunities: sortedOpportunities,
    scannedPageCount: pages.length,
    debug,
  };
}
