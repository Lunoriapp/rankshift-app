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
  sourcePageType?: SitePageTopicProfile["pageType"];
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

const FRAGMENT_EDGE_WORDS = new Set([
  "and",
  "or",
  "but",
  "so",
  "because",
  "with",
  "without",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "from",
  "into",
  "his",
  "her",
  "their",
  "this",
  "that",
  "the",
  "a",
  "an",
]);

const HARD_EDGE_STOPWORDS = new Set([
  "in",
  "and",
  "or",
  "but",
  "of",
  "to",
  "for",
  "with",
  "his",
  "her",
  "their",
  "this",
  "that",
  "the",
  "a",
  "an",
]);

const PRONOUNS = new Set(["his", "her", "their"]);

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

function validateAnchorDetailed(anchor: string): { valid: boolean; reasons: string[] } {
  const normalized = normalizeWhitespace(anchor).toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const reasons: string[] = [];

  if (words.length < 2 || words.length > 5) {
    reasons.push("word-count-not-2-5");
  }

  if (words.length > 0 && HARD_EDGE_STOPWORDS.has(words[0])) {
    reasons.push("starts-with-weak-connector");
  }

  if (words.length > 0 && HARD_EDGE_STOPWORDS.has(words[words.length - 1])) {
    reasons.push("ends-with-weak-connector");
  }

  if (words.some((word) => PRONOUNS.has(word))) {
    reasons.push("contains-pronoun");
  }

  if (isVagueAnchor(normalized)) {
    reasons.push("generic-anchor");
  }

  const meaningfulNounLikeCount = words.filter(
    (word) => !HARD_EDGE_STOPWORDS.has(word) && !FRAGMENT_EDGE_WORDS.has(word) && word.length >= 4,
  ).length;
  if (meaningfulNounLikeCount === 0) {
    reasons.push("no-meaningful-noun");
  }

  const middle = words.slice(1, -1);
  if (
    middle.length > 0 &&
    middle.some((word) => FRAGMENT_EDGE_WORDS.has(word)) &&
    meaningfulNounLikeCount < 2
  ) {
    reasons.push("partial-phrase");
  }

  if (!/[a-z]/.test(normalized) || normalized.length < 8) {
    reasons.push("not-natural-language");
  }

  return { valid: reasons.length === 0, reasons };
}

export function isValidAnchor(anchor: string): boolean {
  return validateAnchorDetailed(anchor).valid;
}

function logAnchorRejection(anchor: string, reasons: string[]) {
  console.debug("[internal-linking][anchor-rejected]", {
    original: anchor,
    reasons,
  });
}

function isNaturalCompleteAnchor(anchor: string): boolean {
  return isValidAnchor(anchor);
}

function normalizeForMatch(value: string): string {
  return normalizeWhitespace(value.toLowerCase().replace(/[^a-z0-9\s'-]+/g, " "));
}

function expandFragmentAnchorFromSentence(
  sourceText: string,
  anchor: string,
  targetTopicTokens: Set<string>,
): string | null {
  const rawWords = normalizeWhitespace(sourceText).split(/\s+/).filter(Boolean);
  const normWords = rawWords.map((word) => normalizeForMatch(word));
  const anchorWords = normalizeForMatch(anchor).split(/\s+/).filter(Boolean);

  if (rawWords.length < 2 || anchorWords.length === 0) {
    return null;
  }

  let matchStart = -1;
  for (let i = 0; i <= normWords.length - anchorWords.length; i += 1) {
    if (normWords.slice(i, i + anchorWords.length).join(" ") === anchorWords.join(" ")) {
      matchStart = i;
      break;
    }
  }

  if (matchStart === -1) {
    return null;
  }

  const matchEnd = matchStart + anchorWords.length - 1;
  const candidates = new Set<string>();

  for (let size = 2; size <= 5; size += 1) {
    for (let start = Math.max(0, matchEnd - size + 1); start <= matchStart; start += 1) {
      const end = start + size - 1;
      if (end >= rawWords.length || start > matchStart || end < matchEnd) {
        continue;
      }

      const candidate = toNaturalAnchor(rawWords.slice(start, end + 1).join(" "));
      if (!isNaturalCompleteAnchor(candidate)) {
        continue;
      }

      candidates.add(candidate);
    }
  }

  if (candidates.size === 0) {
    return null;
  }

  const ranked = [...candidates]
    .map((candidate) => ({
      candidate,
      score:
        overlapRatio(candidate, targetTopicTokens) * 0.58 +
        serviceTopicTermBoost(candidate) * 0.26 +
        naturalLengthScore(candidate) * 0.16,
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.candidate ?? null;
}

function generateTopicAnchorFallback(
  sourceText: string,
  target: SitePageTopicProfile,
  brandCandidates: Set<string>,
): string | null {
  const sourceTokens = tokenizeStemmed(sourceText).slice(0, 18);
  const targetTopic = `${target.title} ${target.h1} ${target.primaryTopic}`;
  const targetTokens = tokenizeStemmed(targetTopic);
  const overlap = sourceTokens.filter((token) => targetTokens.includes(token));
  const phrasePool = [
    normalizeWhitespace(target.primaryTopic),
    normalizeWhitespace(target.topicPhrases.find((phrase) => phrase.source === "title")?.phrase ?? ""),
  ].filter(Boolean);
  const candidates = new Set<string>();

  const pushIfValid = (value: string) => {
    const candidate = toNaturalAnchor(value);
    const validation = validateAnchorDetailed(candidate);
    if (!validation.valid) {
      return;
    }
    if (isBrandLikeAnchor(candidate, brandCandidates) && !isHomepageOrAboutTarget(target.url)) {
      return;
    }
    candidates.add(candidate);
  };

  for (const phrase of phrasePool) {
    const words = phrase.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      pushIfValid(words.slice(0, 2).join(" "));
      pushIfValid(words.slice(0, 3).join(" "));
    }
    if (words.length >= 1) {
      pushIfValid(`${words[0]} services`);
    }
  }

  if (overlap.length > 0 && targetTokens.length > 0) {
    pushIfValid(`${overlap[0]} ${targetTokens[0]}`);
    if (targetTokens[1]) {
      pushIfValid(`${targetTokens[0]} ${targetTokens[1]}`);
    }
  }

  const ranked = [...candidates].sort((a, b) => b.length - a.length);
  return ranked[0] ?? null;
}

function intentBoostForPageType(
  anchor: string,
  pageType: SitePageTopicProfile["pageType"],
): number {
  const normalized = normalizeWhitespace(anchor).toLowerCase();

  const serviceIntentTerms = [
    "service",
    "services",
    "agency",
    "consultant",
    "consulting",
    "law",
    "mediation",
    "support",
  ];
  const informationalTerms = ["how", "guide", "tips", "checklist", "best", "what is", "why"];
  const ecommerceTerms = ["buy", "shop", "product", "category", "collection", "price"];

  const matches = (terms: string[]) => terms.filter((term) => normalized.includes(term)).length;

  if (pageType === "service") {
    return Math.min(1, 0.45 + matches(serviceIntentTerms) * 0.25);
  }

  if (pageType === "blog") {
    return Math.min(1, 0.4 + matches(informationalTerms) * 0.28);
  }

  if (pageType === "ecommerce") {
    return Math.min(1, 0.42 + matches(ecommerceTerms) * 0.28);
  }

  return 0.55;
}

function rankCandidate(
  candidate: AnchorSuggestion,
  target: SitePageTopicProfile,
  sourcePageType: SitePageTopicProfile["pageType"],
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
  const completePhraseScore = isNaturalCompleteAnchor(candidate.anchor) ? 1 : 0;
  const intentBoost = intentBoostForPageType(candidate.anchor, sourcePageType);
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
      completePhraseScore * 0.12 +
      intentBoost * 0.1 +
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
  const sourcePageType = options.sourcePageType ?? "general";
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
      const repairedAnchor = isNaturalCompleteAnchor(anchor)
        ? anchor
        : expandFragmentAnchorFromSentence(sourceText, anchor, targetTopicTokens);
      const fallbackAnchor = generateTopicAnchorFallback(sourceText, target, brandCandidates);
      const finalAnchor = repairedAnchor ?? fallbackAnchor ?? anchor;
      const validation = validateAnchorDetailed(finalAnchor);

      if (finalAnchor.length < 4) {
        logAnchorRejection(finalAnchor, ["too-short"]);
        continue;
      }

      if (isVagueAnchor(finalAnchor)) {
        logAnchorRejection(finalAnchor, ["generic-anchor"]);
        continue;
      }

      if (!validation.valid) {
        logAnchorRejection(finalAnchor, validation.reasons);
        continue;
      }

      if (blockedAnchors.has(normalizeAnchorForCompare(finalAnchor))) {
        continue;
      }

      if (
        isBrandLikeAnchor(finalAnchor, brandCandidates) &&
        !isHomepageOrAboutTarget(target.url)
      ) {
        continue;
      }

      candidates.push({
        anchor: finalAnchor,
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
      const repairedAnchor = isNaturalCompleteAnchor(anchor)
        ? anchor
        : expandFragmentAnchorFromSentence(sourceText, anchor, targetTopicTokens);
      const fallbackAnchor = generateTopicAnchorFallback(sourceText, target, brandCandidates);
      const finalAnchor = repairedAnchor ?? fallbackAnchor ?? anchor;
      const validation = validateAnchorDetailed(finalAnchor);

      if (finalAnchor.length < 4) {
        logAnchorRejection(finalAnchor, ["too-short"]);
        continue;
      }

      if (isVagueAnchor(finalAnchor)) {
        logAnchorRejection(finalAnchor, ["generic-anchor"]);
        continue;
      }

      if (!validation.valid) {
        logAnchorRejection(finalAnchor, validation.reasons);
        continue;
      }

      if (blockedAnchors.has(normalizeAnchorForCompare(finalAnchor))) {
        continue;
      }

      if (
        isBrandLikeAnchor(finalAnchor, brandCandidates) &&
        !isHomepageOrAboutTarget(target.url)
      ) {
        continue;
      }

      candidates.push({
        anchor: finalAnchor,
        matchType: "close",
        phraseSource: phrase.source,
        phraseWeight: phrase.weight,
      });
    }
  }

  for (const nounPhrase of extractNounPhraseCandidates(sourceText, targetTopicTokens)) {
    if (!isNaturalCompleteAnchor(nounPhrase)) {
      continue;
    }

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
          sourcePageType,
          titleTopicTokens,
          h1TopicTokens,
          primaryTopicTokens,
          brandCandidates,
        ),
      )
      .sort((a, b) => b.score - a.score || b.phraseWeight - a.phraseWeight || b.anchor.length - a.anchor.length);

    const bestValid = ranked.find(
      (entry) =>
        isValidAnchor(entry.anchor) &&
        !isVagueAnchor(entry.anchor) &&
        !blockedAnchors.has(normalizeAnchorForCompare(entry.anchor)),
    );

    if (!bestValid) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[internal-linking][anchor-debug]", {
          contextSentence: sourceText,
          targetPageTopic: target.primaryTopic,
          candidatePhrases: ranked.map((entry) => entry.anchor),
          selectedAnchor: null,
        });
      }
      for (const entry of ranked.slice(0, 3)) {
        const validation = validateAnchorDetailed(entry.anchor);
        if (!validation.valid) {
          logAnchorRejection(entry.anchor, validation.reasons);
        }
      }
      return null;
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug("[internal-linking][anchor-debug]", {
        contextSentence: sourceText,
        targetPageTopic: target.primaryTopic,
        candidatePhrases: ranked.map((entry) => entry.anchor),
        selectedAnchor: bestValid.anchor,
      });
    }

    return {
      anchor: bestValid.anchor,
      matchType: bestValid.matchType,
      phraseSource: bestValid.phraseSource,
      phraseWeight: bestValid.phraseWeight,
    };
  }

  return null;
}
