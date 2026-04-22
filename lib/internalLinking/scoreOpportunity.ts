import type { InternalLinkConfidence, SiteContentContext, SitePageTopicProfile } from "./types";
import type { AnchorSuggestion } from "./suggestAnchorText";
import { tokenize } from "./shared";

interface ScoreOpportunityInput {
  source: SitePageTopicProfile;
  target: SitePageTopicProfile;
  context: SiteContentContext;
  suggestion: AnchorSuggestion;
}

export interface OpportunityScore {
  score: number;
  confidence: InternalLinkConfidence;
  signals: {
    sourceTopicAlignment: number;
    targetTopicAlignment: number;
    sourceTargetAlignment: number;
    sectionRelevance: number;
    topOfPageWeight: number;
    anchorNaturalness: number;
  };
}

function overlapScore(sourceTerms: string[], targetTerms: string[]): number {
  const sourceSet = new Set(sourceTerms);
  const targetSet = new Set(targetTerms);
  const matches = [...targetSet].filter((term) => sourceSet.has(term)).length;

  return Math.min(1, matches / Math.max(3, targetSet.size));
}

function anchorNaturalness(anchor: string): number {
  const words = anchor.trim().split(/\s+/).filter(Boolean).length;

  if (words >= 2 && words <= 5) {
    return 1;
  }

  if (words === 1 || words === 6) {
    return 0.78;
  }

  return 0.52;
}

function sectionRelevance(sectionLabel: string): number {
  const label = sectionLabel.toLowerCase();

  if (label.includes("intro") || label.includes("overview") || label.includes("summary")) {
    return 1;
  }

  if (label.includes("related") || label.includes("faq") || label.includes("references")) {
    return 0.7;
  }

  return 0.88;
}

function topOfPageWeight(position: number): number {
  if (position <= 2) {
    return 1;
  }

  if (position <= 6) {
    return 0.9;
  }

  if (position <= 12) {
    return 0.8;
  }

  return 0.68;
}

function coreTopicTerms(profile: SitePageTopicProfile): string[] {
  const strongestTitlePhrase = profile.topicPhrases.find((phrase) => phrase.source === "title")?.phrase ?? "";

  return [
    ...tokenize(profile.primaryTopic),
    ...tokenize(profile.h1),
    ...tokenize(strongestTitlePhrase),
  ];
}

export function scoreOpportunity({
  source,
  target,
  context,
  suggestion,
}: ScoreOpportunityInput): OpportunityScore {
  const topicalOverlap = overlapScore(
    [...source.keywords, ...source.topicPhrases.flatMap((phrase) => tokenize(phrase.phrase))],
    [...target.keywords, ...target.topicPhrases.flatMap((phrase) => tokenize(phrase.phrase))],
  );
  const sourceTopicAlignment = overlapScore(
    coreTopicTerms(source),
    tokenize(suggestion.anchor),
  );
  const targetTopicAlignment = overlapScore(
    coreTopicTerms(target),
    tokenize(suggestion.anchor),
  );
  const phraseMatchScore =
    suggestion.matchType === "exact" ? 1 : suggestion.matchType === "close" ? 0.8 : 0.45;
  const phraseSourceWeight =
    suggestion.phraseSource === "h1"
      ? 1
      : suggestion.phraseSource === "title"
        ? 0.96
        : suggestion.phraseSource === "h2"
          ? 0.88
          : 0.66;
  const contextStrength =
    context.text.length >= 70 && context.text.length <= 240
      ? 1
      : context.text.length >= 45 && context.text.length <= 320
        ? 0.84
        : 0.65;
  const sectionWeight = sectionRelevance(context.sectionLabel);
  const topSectionWeight = topOfPageWeight(context.position);
  const naturalAnchorWeight = anchorNaturalness(suggestion.anchor);
  const blockWeight = context.blockType === "paragraph" ? 1 : 0.8;
  const commercialWeight = target.commerciallyImportant ? 1 : 0.72;
  const supportWeight =
    target.inboundInternalLinkCount <= 1
      ? 1
      : target.inboundInternalLinkCount <= 3
        ? 0.82
        : 0.62;

  const score = Math.round(
    phraseMatchScore * 22 +
      targetTopicAlignment * 22 +
      sourceTopicAlignment * 14 +
      topicalOverlap * 12 +
      phraseSourceWeight * 8 +
      contextStrength * 7 +
      sectionWeight * 5 +
      topSectionWeight * 4 +
      naturalAnchorWeight * 3 +
      blockWeight * 1 +
      commercialWeight * 1 +
      supportWeight * 1,
  );

  const confidence: InternalLinkConfidence =
    score >= 78 ? "High" : score >= 58 ? "Medium" : "Low";

  return {
    score,
    confidence,
    signals: {
      sourceTopicAlignment,
      targetTopicAlignment,
      sourceTargetAlignment: topicalOverlap,
      sectionRelevance: sectionWeight,
      topOfPageWeight: topSectionWeight,
      anchorNaturalness: naturalAnchorWeight,
    },
  };
}
