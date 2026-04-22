import type { SitePageTopicProfile, TopicPhraseCandidate } from "./types";
import {
  findClosePhraseMatches,
  findPhraseMatch,
  isWeakTopicPhrase,
  normalizeWhitespace,
  phraseWordOverlap,
  tokenizeStemmed,
} from "./shared";

export interface AnchorSuggestion {
  anchor: string;
  matchType: "exact" | "close" | "fallback";
  phraseSource: TopicPhraseCandidate["source"];
  phraseWeight: number;
}

interface SuggestAnchorTextOptions {
  preferredPhrases?: TopicPhraseCandidate[];
}

interface RankedAnchorCandidate extends AnchorSuggestion {
  score: number;
}

function cleanAnchor(value: string): string {
  return normalizeWhitespace(value.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, ""));
}

const WEAK_EDGE_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "to",
  "for",
  "of",
  "in",
  "on",
  "with",
  "by",
  "at",
  "from",
  "your",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
]);

const VAGUE_ANCHORS = new Set([
  "click here",
  "learn more",
  "read more",
  "our services",
  "our service",
  "find out more",
  "discover more",
  "more info",
  "more information",
  "this page",
  "this article",
]);

function trimWeakEdgeWords(value: string): string {
  const words = value.split(/\s+/).filter(Boolean);

  while (words.length > 1 && WEAK_EDGE_WORDS.has(words[0].toLowerCase())) {
    words.shift();
  }

  while (words.length > 1 && WEAK_EDGE_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }

  return words.join(" ");
}

function toNaturalAnchor(rawMatch: string): string {
  const cleaned = cleanAnchor(trimWeakEdgeWords(rawMatch));
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length <= 5) {
    return cleaned;
  }

  return words.slice(0, 4).join(" ");
}

function overlapRatio(anchor: string, topicTokens: Set<string>): number {
  if (topicTokens.size === 0) {
    return 0;
  }

  const anchorTokens = new Set(tokenizeStemmed(anchor));

  if (anchorTokens.size === 0) {
    return 0;
  }

  let overlapCount = 0;

  for (const token of anchorTokens) {
    if (topicTokens.has(token)) {
      overlapCount += 1;
    }
  }

  return overlapCount / anchorTokens.size;
}

function naturalLengthScore(anchor: string): number {
  const words = anchor.split(/\s+/).filter(Boolean).length;

  if (words >= 2 && words <= 5) {
    return 1;
  }

  if (words === 1 || words === 6) {
    return 0.7;
  }

  return 0.45;
}

function isVagueAnchor(anchor: string): boolean {
  const normalized = normalizeWhitespace(anchor).toLowerCase();

  if (VAGUE_ANCHORS.has(normalized)) {
    return true;
  }

  return (
    normalized.startsWith("learn more") ||
    normalized.startsWith("read more") ||
    normalized.startsWith("click here")
  );
}

function rankCandidate(
  candidate: AnchorSuggestion,
  titleTopicTokens: Set<string>,
  h1TopicTokens: Set<string>,
  primaryTopicTokens: Set<string>,
): RankedAnchorCandidate {
  const matchScore =
    candidate.matchType === "exact" ? 1 : candidate.matchType === "close" ? 0.82 : 0.45;
  const titleAffinity = overlapRatio(candidate.anchor, titleTopicTokens);
  const h1Affinity = overlapRatio(candidate.anchor, h1TopicTokens);
  const primaryTopicAffinity = overlapRatio(candidate.anchor, primaryTopicTokens);
  const lengthScore = naturalLengthScore(candidate.anchor);

  return {
    ...candidate,
    score:
      matchScore * 0.35 +
      candidate.phraseWeight * 0.2 +
      titleAffinity * 0.25 +
      h1Affinity * 0.12 +
      primaryTopicAffinity * 0.05 +
      lengthScore * 0.03,
  };
}

function buildFallbackAnchor(target: SitePageTopicProfile): string {
  const orderedCandidates = [
    target.title,
    target.h1,
    target.primaryTopic,
    ...target.topicPhrases
      .filter((phrase) => phrase.source === "title" || phrase.source === "h1")
      .map((phrase) => phrase.phrase),
  ];

  for (const candidate of orderedCandidates) {
    const cleaned = toNaturalAnchor(candidate);

    if (cleaned.length >= 4) {
      return cleaned;
    }
  }

  return cleanAnchor(target.h1 || target.title || target.primaryTopic);
}

export function suggestAnchorText(
  sourceText: string,
  target: SitePageTopicProfile,
  options: SuggestAnchorTextOptions = {},
): AnchorSuggestion | null {
  const titleTopicTokens = new Set(tokenizeStemmed(target.primaryTopic));
  const h1TopicTokens = new Set(tokenizeStemmed(target.h1));
  const primaryTopicTokens = new Set(tokenizeStemmed(target.primaryTopic));
  const candidates: AnchorSuggestion[] = [];
  const targetSignalText = `${target.title} ${target.h1} ${target.primaryTopic}`;
  const preferredPhrases = (options.preferredPhrases ?? [])
    .filter((phrase) => !isWeakTopicPhrase(phrase.phrase))
    .filter((phrase) => phraseWordOverlap(targetSignalText, phrase.phrase) >= 0.55)
    .map((phrase) => ({
      ...phrase,
      weight: Math.max(0.92, phrase.weight),
    }));
  const phrasePool = [...preferredPhrases, ...target.topicPhrases];
  const seenPhrases = new Set<string>();
  const uniquePhrasePool = phrasePool.filter((phrase) => {
    const key = phrase.phrase.trim().toLowerCase();

    if (seenPhrases.has(key)) {
      return false;
    }

    seenPhrases.add(key);
    return true;
  });

  for (const phrase of uniquePhrasePool) {
    if (isWeakTopicPhrase(phrase.phrase)) {
      continue;
    }

    const exactMatch = findPhraseMatch(sourceText, phrase.phrase);

    if (exactMatch && exactMatch.length >= 4) {
      const anchor = toNaturalAnchor(exactMatch);

      if (anchor.length < 4) {
        continue;
      }

      if (isVagueAnchor(anchor)) {
        continue;
      }

      candidates.push({
        anchor,
        matchType: "exact",
        phraseSource: phrase.source,
        phraseWeight: phrase.weight,
      });
    }
  }

  for (const phrase of uniquePhrasePool) {
    if (isWeakTopicPhrase(phrase.phrase)) {
      continue;
    }

    if (phraseWordOverlap(sourceText, phrase.phrase) < 0.67 || phrase.phrase.length < 4) {
      continue;
    }

    const closeMatches = findClosePhraseMatches(sourceText, phrase.phrase, 1);
    const closeMatch = closeMatches[0];

    if (closeMatch) {
      const anchor = toNaturalAnchor(closeMatch);

      if (anchor.length < 4) {
        continue;
      }

      if (isVagueAnchor(anchor)) {
        continue;
      }

      candidates.push({
        anchor,
        matchType: "close",
        phraseSource: phrase.source,
        phraseWeight: phrase.weight,
      });
    }
  }

  if (candidates.length > 0) {
    const ranked = candidates
      .map((candidate) => rankCandidate(candidate, titleTopicTokens, h1TopicTokens, primaryTopicTokens))
      .sort((a, b) => b.score - a.score || b.phraseWeight - a.phraseWeight || b.anchor.length - a.anchor.length);

    return {
      anchor: ranked[0].anchor,
      matchType: ranked[0].matchType,
      phraseSource: ranked[0].phraseSource,
      phraseWeight: ranked[0].phraseWeight,
    };
  }

  const fallback = buildFallbackAnchor(target);

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
