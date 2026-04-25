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
  blockedAnchors?: Set<string> | string[];
  brandCandidates?: Set<string> | string[];
}

interface RankedAnchorCandidate extends AnchorSuggestion {
  score: number;
}

const SERVICE_TOPIC_TERMS = new Set([
  "agency",
  "services",
  "service",
  "specialists",
  "specialist",
  "lawyers",
  "lawyer",
  "consultants",
  "consultant",
  "advice",
  "support",
  "recruitment",
  "seo",
  "family law",
  "web design",
  "design",
  "audit",
  "marketing",
]);

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
  "related page link",
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

function serviceTopicTermBoost(anchor: string): number {
  const normalized = normalizeWhitespace(anchor).toLowerCase();
  let matches = 0;

  for (const term of SERVICE_TOPIC_TERMS) {
    if (normalized.includes(term)) {
      matches += 1;
    }
  }

  if (matches >= 2) {
    return 1;
  }

  if (matches === 1) {
    return 0.76;
  }

  return 0.35;
}

function isBrandLikeAnchor(anchor: string, brandCandidates: Set<string>): boolean {
  const normalized = normalizeWhitespace(anchor).toLowerCase();

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

    return normalized === brand || normalized.startsWith(`${brand} `) || normalized.endsWith(` ${brand}`);
  });
}

function isHomepageOrAboutTarget(targetUrl: string): boolean {
  try {
    const pathname = new URL(targetUrl).pathname.toLowerCase();
    return pathname === "/" || /\/about(?:[-_/]|$)/.test(pathname);
  } catch {
    return false;
  }
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
  target: SitePageTopicProfile,
  titleTopicTokens: Set<string>,
  h1TopicTokens: Set<string>,
  primaryTopicTokens: Set<string>,
  brandCandidates: Set<string>,
): RankedAnchorCandidate {
  const matchScore =
    candidate.matchType === "exact" ? 1 : candidate.matchType === "close" ? 0.82 : 0.45;
  const titleAffinity = overlapRatio(candidate.anchor, titleTopicTokens);
  const h1Affinity = overlapRatio(candidate.anchor, h1TopicTokens);
  const primaryTopicAffinity = overlapRatio(candidate.anchor, primaryTopicTokens);
  const lengthScore = naturalLengthScore(candidate.anchor);
  const serviceBoost = serviceTopicTermBoost(candidate.anchor);
  const brandPenalty = isBrandLikeAnchor(candidate.anchor, brandCandidates)
    ? isHomepageOrAboutTarget(target.url)
      ? 0.55
      : 1.45
    : 0;

  return {
    ...candidate,
    score:
      matchScore * 0.28 +
      candidate.phraseWeight * 0.18 +
      titleAffinity * 0.22 +
      h1Affinity * 0.12 +
      primaryTopicAffinity * 0.09 +
      serviceBoost * 0.11 +
      lengthScore * 0.08 -
      brandPenalty * 0.34,
  };
}

function normalizeAnchorForCompare(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function extractNounPhraseCandidates(
  sourceText: string,
  targetTopicTokens: Set<string>,
): string[] {
  const words = (sourceText.match(/[a-z0-9&'-]+/gi) ?? [])
    .map((word) => normalizeWhitespace(word))
    .filter((word) => word.length >= 2);
  const candidates = new Set<string>();

  for (let size = 2; size <= 5; size += 1) {
    for (let index = 0; index <= words.length - size; index += 1) {
      const phrase = toNaturalAnchor(words.slice(index, index + size).join(" "));
      const tokens = tokenizeStemmed(phrase);

      if (phrase.length < 4 || isVagueAnchor(phrase) || tokens.length < 2) {
        continue;
      }

      const overlap = overlapRatio(phrase, targetTopicTokens);

      if (overlap < 0.34) {
        continue;
      }

      candidates.add(phrase);
    }
  }

  return [...candidates];
}

export function suggestAnchorText(
  sourceText: string,
  target: SitePageTopicProfile,
  options: SuggestAnchorTextOptions = {},
): AnchorSuggestion | null {
  const titleTopicTokens = new Set(tokenizeStemmed(target.primaryTopic));
  const h1TopicTokens = new Set(tokenizeStemmed(target.h1));
  const primaryTopicTokens = new Set(tokenizeStemmed(target.primaryTopic));
  const targetTopicTokens = new Set(
    tokenizeStemmed(`${target.title} ${target.h1} ${target.primaryTopic}`),
  );
  const blockedAnchors =
    options.blockedAnchors instanceof Set
      ? new Set(
          [...options.blockedAnchors].map((value) => normalizeAnchorForCompare(value)),
        )
      : new Set((options.blockedAnchors ?? []).map((value) => normalizeAnchorForCompare(value)));
  const brandCandidates =
    options.brandCandidates instanceof Set
      ? options.brandCandidates
      : new Set((options.brandCandidates ?? []).map((value) => normalizeAnchorForCompare(value)));
  const candidates: AnchorSuggestion[] = [];
  const targetSignalText = `${target.title} ${target.h1} ${target.primaryTopic}`;
  const preferredPhrases = (options.preferredPhrases ?? [])
    .filter((phrase) => !isWeakTopicPhrase(phrase.phrase))
    .filter((phrase) => phraseWordOverlap(targetSignalText, phrase.phrase) >= 0.55)
    .filter((phrase) => {
      const words = normalizeWhitespace(phrase.phrase).split(/\s+/).filter(Boolean).length;
      return words >= 2 && words <= 5;
    })
    .filter((phrase) => !isBrandLikeAnchor(phrase.phrase, brandCandidates))
    .map((phrase) => ({
      ...phrase,
      // Keep source phrase hints lightweight so topical in-sentence noun phrases can win.
      weight: Math.min(0.72, Math.max(0.58, phrase.weight * 0.75)),
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

      if (blockedAnchors.has(normalizeAnchorForCompare(anchor))) {
        continue;
      }

      if (isBrandLikeAnchor(anchor, brandCandidates) && !isHomepageOrAboutTarget(target.url)) {
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

      if (blockedAnchors.has(normalizeAnchorForCompare(anchor))) {
        continue;
      }

      if (isBrandLikeAnchor(anchor, brandCandidates) && !isHomepageOrAboutTarget(target.url)) {
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

  for (const nounPhrase of extractNounPhraseCandidates(sourceText, targetTopicTokens)) {
    if (blockedAnchors.has(normalizeAnchorForCompare(nounPhrase))) {
      continue;
    }

    if (isBrandLikeAnchor(nounPhrase, brandCandidates) && !isHomepageOrAboutTarget(target.url)) {
      continue;
    }

    candidates.push({
      anchor: nounPhrase,
      matchType: "close",
      phraseSource: "body_term",
      phraseWeight: 0.78,
    });
  }

  if (candidates.length > 0) {
    const ranked = candidates
      .map((candidate) =>
        rankCandidate(
          candidate,
          target,
          titleTopicTokens,
          h1TopicTokens,
          primaryTopicTokens,
          brandCandidates,
        ),
      )
      .sort((a, b) => b.score - a.score || b.phraseWeight - a.phraseWeight || b.anchor.length - a.anchor.length);

    return {
      anchor: ranked[0].anchor,
      matchType: ranked[0].matchType,
      phraseSource: ranked[0].phraseSource,
      phraseWeight: ranked[0].phraseWeight,
    };
  }

  return null;
}
