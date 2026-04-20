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
}

function overlapScore(sourceTerms: string[], targetTerms: string[]): number {
  const sourceSet = new Set(sourceTerms);
  const targetSet = new Set(targetTerms);
  const matches = [...targetSet].filter((term) => sourceSet.has(term)).length;

  return Math.min(1, matches / Math.max(3, targetSet.size));
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
  const blockWeight = context.blockType === "paragraph" ? 1 : 0.8;
  const commercialWeight = target.commerciallyImportant ? 1 : 0.72;
  const supportWeight =
    target.inboundInternalLinkCount <= 1
      ? 1
      : target.inboundInternalLinkCount <= 3
        ? 0.82
        : 0.62;

  const score = Math.round(
    phraseMatchScore * 34 +
      topicalOverlap * 22 +
      phraseSourceWeight * 16 +
      contextStrength * 10 +
      blockWeight * 6 +
      commercialWeight * 7 +
      supportWeight * 5,
  );

  const confidence: InternalLinkConfidence =
    score >= 78 ? "High" : score >= 58 ? "Medium" : "Low";

  return { score, confidence };
}
