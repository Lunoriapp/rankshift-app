import type { SitePageTopicProfile, TopicPhraseCandidate } from "./types";
import {
  findClosePhraseMatches,
  findPhraseMatch,
  isWeakTopicPhrase,
  normalizeWhitespace,
  phraseWordOverlap,
} from "./shared";

export interface AnchorSuggestion {
  anchor: string;
  matchType: "exact" | "close" | "fallback";
  phraseSource: TopicPhraseCandidate["source"];
  phraseWeight: number;
}

function cleanAnchor(value: string): string {
  return normalizeWhitespace(value.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, ""));
}

export function suggestAnchorText(
  sourceText: string,
  target: SitePageTopicProfile,
): AnchorSuggestion | null {
  for (const phrase of target.topicPhrases) {
    if (isWeakTopicPhrase(phrase.phrase)) {
      continue;
    }

    const exactMatch = findPhraseMatch(sourceText, phrase.phrase);

    if (exactMatch && exactMatch.length >= 4) {
      return {
        anchor: cleanAnchor(exactMatch),
        matchType: "exact",
        phraseSource: phrase.source,
        phraseWeight: phrase.weight,
      };
    }
  }

  for (const phrase of target.topicPhrases) {
    if (isWeakTopicPhrase(phrase.phrase)) {
      continue;
    }

    if (phraseWordOverlap(sourceText, phrase.phrase) < 0.67 || phrase.phrase.length < 4) {
      continue;
    }

    const closeMatches = findClosePhraseMatches(sourceText, phrase.phrase, 1);
    const closeMatch = closeMatches[0];

    if (closeMatch) {
      return {
        anchor: cleanAnchor(closeMatch),
        matchType: "close",
        phraseSource: phrase.source,
        phraseWeight: phrase.weight,
      };
    }
  }

  const fallback = cleanAnchor(target.h1 || target.title || target.primaryTopic);

  if (!fallback) {
    return null;
  }

  return {
    anchor: fallback,
    matchType: "fallback",
    phraseSource: "h1",
    phraseWeight: 0.3,
  };
}
