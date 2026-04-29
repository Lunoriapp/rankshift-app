import type { SitePageTopicProfile, TopicPhraseCandidate } from "./types";
import { normalizeWhitespace, tokenizeStemmed } from "./shared";

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

interface CandidateScore {
  anchor: string;
  score: number;
  phraseSource: TopicPhraseCandidate["source"];
  matchType: AnchorSuggestion["matchType"];
  phraseWeight: number;
}

interface RejectedCandidate {
  anchor: string;
  reasons: string[];
}

const EDGE_STOPWORDS = new Set([
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

const FRAGMENT_WORDS = new Set([
  ...EDGE_STOPWORDS,
  "on",
  "at",
  "by",
  "from",
  "into",
  "who",
]);

const WEAK_VERBS = new Set(["is", "are", "was", "were", "be", "being", "been", "can"]);
const AUXILIARY_VERBS = new Set(["could", "should", "would"]);
const PRONOUNS = new Set(["his", "her", "their", "who"]);
const CONTACT_TERMS = new Set(["call", "email", "contact", "phone", "tel", "reach"]);
const GENERIC_ANCHORS = new Set([
  "click here",
  "read more",
  "learn more",
  "find out more",
  "this page",
  "related page link",
]);
const CONNECTOR_WORDS = new Set(["with", "of", "for", "in", "on", "and", "or", "to"]);
const SENTENCE_VERBS = new Set([...WEAK_VERBS, ...AUXILIARY_VERBS, "seen"]);

const NOUNISH_TERMS = new Set([
  "service",
  "services",
  "agency",
  "recruitment",
  "mediation",
  "law",
  "sculpture",
  "sculptures",
  "sculptor",
  "bronze",
  "audit",
  "seo",
  "boots",
  "installation",
  "studio",
  "biography",
  "profile",
  "consultant",
  "category",
  "product",
]);

function normalizeAnchor(value: string): string {
  const standardized = value.replace(/[’]/g, "'");
  return normalizeWhitespace(standardized.toLowerCase().replace(/[^a-z0-9\s'&-]+/g, " "));
}

function normalizeAnchorForCompare(value: string): string {
  return normalizeAnchor(value).replace(/[’]/g, "'");
}

function restorePossessiveApostrophes(value: string): string {
  return normalizeWhitespace(value).replace(/\b([A-Za-z]+)\s+s\b/g, "$1’s");
}

function isBrandLike(anchor: string, brandCandidates: Set<string>): boolean {
  const normalized = normalizeAnchor(anchor);
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

function validateAnchorDetailed(anchor: string): { valid: boolean; reasons: string[] } {
  const normalized = normalizeAnchorForCompare(anchor);
  const words = normalized.split(/\s+/).filter(Boolean);
  const reasons: string[] = [];

  if (words.length < 2 || words.length > 5) {
    reasons.push("word-count-not-2-5");
  }

  if (words.length > 0 && EDGE_STOPWORDS.has(words[0])) {
    reasons.push("starts-with-stopword");
  }

  if (words.length > 0 && EDGE_STOPWORDS.has(words[words.length - 1])) {
    reasons.push("ends-with-stopword");
  }

  if (words.some((word) => WEAK_VERBS.has(word) || AUXILIARY_VERBS.has(word))) {
    reasons.push("contains-verb");
  }

  if (words.some((word) => PRONOUNS.has(word))) {
    reasons.push("contains-pronoun");
  }

  if (words.some((word) => CONTACT_TERMS.has(word))) {
    reasons.push("contains-contact-term");
  }

  if (words.some((word) => /\d/.test(word))) {
    reasons.push("contains-number");
  }

  if (/\b\d{3,}\b/.test(normalized)) {
    reasons.push("contains-phone-number");
  }

  if (GENERIC_ANCHORS.has(normalized)) {
    reasons.push("generic-anchor");
  }

  const meaningfulNounish = words.filter(
    (word) => word.length >= 4 && !FRAGMENT_WORDS.has(word) && !WEAK_VERBS.has(word),
  );
  const nounishHintCount = words.filter((word) => NOUNISH_TERMS.has(word)).length;
  if (meaningfulNounish.length === 0 && nounishHintCount === 0) {
    reasons.push("no-meaningful-noun");
  }

  if (words.length >= 3) {
    const middle = words.slice(1, -1);
    const middleFragments = middle.filter((word) => FRAGMENT_WORDS.has(word)).length;
    if (middleFragments > 0 && meaningfulNounish.length < 2 && nounishHintCount < 1) {
      reasons.push("partial-phrase");
    }
  }

  if (normalized.length < 8) {
    reasons.push("too-short-for-natural-anchor");
  }

  if (/\b[a-z]{1,2}\b/.test(normalized) && words.length >= 3) {
    reasons.push("machine-looking-fragment");
  }

  if (words.includes("s")) {
    reasons.push("orphan-possessive-fragment");
  }

  return { valid: reasons.length === 0, reasons };
}

export function isValidAnchor(anchor: string): boolean {
  return validateAnchorDetailed(anchor).valid;
}

export function isHumanQualityAnchor(anchor: string): boolean {
  return validateAnchorDetailed(anchor).valid;
}

function logAnchorRejected(anchor: string, reasons: string[]) {
  console.debug("[internal-linking][anchor-rejected]", { original: anchor, reasons });
}

function tokenizeWords(sourceText: string): string[] {
  return (sourceText.match(/[a-z0-9'&-]+/gi) ?? []).map((word) => normalizeAnchor(word));
}

interface Token {
  raw: string;
  normalized: string;
}

function tokenizeWithOriginalText(sourceText: string): Token[] {
  const matches = sourceText.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?|&/g) ?? [];
  return matches.map((raw) => ({
    raw,
    normalized: normalizeAnchorForCompare(raw),
  }));
}

function repairCandidateAnchor(anchor: string): string {
  const repairedPossessive = restorePossessiveApostrophes(anchor);
  return normalizeWhitespace(
    repairedPossessive
      .replace(/\bbob['’]?s\b/gi, "Bob’s")
      .replace(/\bartist['’]?s\b/gi, "artist’s")
      .replace(/\bcompany['’]?s\b/gi, "company’s"),
  );
}

function extractCandidateNounPhrasesFromSentence(sourceText: string): string[] {
  const tokens = tokenizeWithOriginalText(sourceText);
  const candidates = new Set<string>();

  for (let size = 2; size <= 5; size += 1) {
    for (let i = 0; i <= tokens.length - size; i += 1) {
      const window = tokens.slice(i, i + size);
      const normalizedWindow = window.map((token) => token.normalized);

      if (
        normalizedWindow.some(
          (word) =>
            !word ||
            SENTENCE_VERBS.has(word) ||
            CONTACT_TERMS.has(word) ||
            PRONOUNS.has(word) ||
            /\d/.test(word),
        )
      ) {
        continue;
      }

      const first = normalizedWindow[0] ?? "";
      const last = normalizedWindow[normalizedWindow.length - 1] ?? "";
      if (EDGE_STOPWORDS.has(first) || EDGE_STOPWORDS.has(last) || CONNECTOR_WORDS.has(last)) {
        continue;
      }

      if (
        normalizedWindow.length >= 3 &&
        normalizedWindow.some((word, index) => index > 0 && index < normalizedWindow.length - 1 && CONNECTOR_WORDS.has(word))
      ) {
        continue;
      }

      const phraseRaw = normalizeWhitespace(window.map((token) => token.raw).join(" "));
      const phrase = repairCandidateAnchor(phraseRaw);
      if (!phrase) {
        continue;
      }

      candidates.add(phrase);
    }
  }

  return [...candidates];
}

function scoreAgainstTarget(
  candidate: string,
  target: SitePageTopicProfile,
  sourcePageType: SitePageTopicProfile["pageType"],
): number {
  const candidateTokens = new Set(tokenizeStemmed(candidate));
  const targetTitleTokens = new Set(tokenizeStemmed(target.title));
  const targetSlugTokens = new Set(tokenizeStemmed(new URL(target.url).pathname));
  const targetHeadingTokens = new Set(tokenizeStemmed(`${target.h1} ${target.h2s.join(" ")}`));

  const overlap = (a: Set<string>, b: Set<string>) => [...a].filter((token) => b.has(token)).length;
  const titleMatch = overlap(candidateTokens, targetTitleTokens);
  const slugMatch = overlap(candidateTokens, targetSlugTokens);
  const headingMatch = overlap(candidateTokens, targetHeadingTokens);

  const words = candidate.split(/\s+/).filter(Boolean);
  const lengthScore = words.length >= 2 && words.length <= 4 ? 1.2 : 0.5;
  const nounishScore = words.filter((word) => NOUNISH_TERMS.has(word)).length;
  const connectorCount = words.filter((word) => CONNECTOR_WORDS.has(word)).length;
  const overlapRatio = candidateTokens.size
    ? overlap(candidateTokens, new Set([...targetTitleTokens, ...targetSlugTokens, ...targetHeadingTokens])) /
      candidateTokens.size
    : 0;
  const exactPhraseBoost = (() => {
    const normalizedCandidate = normalizeAnchor(candidate);
    const title = normalizeAnchor(target.title);
    const h1 = normalizeAnchor(target.h1);
    const topic = normalizeAnchor(target.primaryTopic);
    if (
      normalizedCandidate === topic ||
      normalizedCandidate === h1 ||
      title.includes(normalizedCandidate)
    ) {
      return 6;
    }
    return 0;
  })();

  const pageTypeBoost = (() => {
    const normalized = normalizeAnchor(candidate);
    if (sourcePageType === "service") {
      return /service|agency|mediation|installation|consultant|audit/.test(normalized) ? 1 : 0.4;
    }
    if (sourcePageType === "blog") {
      return /guide|strategy|audit|how/.test(normalized) ? 1 : 0.4;
    }
    if (sourcePageType === "ecommerce") {
      return /boots|product|category|collection|shop/.test(normalized) ? 1 : 0.4;
    }
    if (sourcePageType === "profile") {
      return /sculptor|artist|expert|specialist|biography|profile/.test(normalized) ? 1 : 0.45;
    }
    if (sourcePageType === "homepage") {
      return /services|solutions|agency|support/.test(normalized) ? 1 : 0.45;
    }
    return 0.6;
  })();

  return (
    titleMatch * 6 +
    slugMatch * 7 +
    headingMatch * 5 +
    nounishScore * 2 +
    lengthScore * 2 +
    pageTypeBoost * 3 +
    overlapRatio * 8 +
    exactPhraseBoost -
    connectorCount * 2.5
  );
}

function expandBrokenPhraseWithinSentence(sourceText: string, anchor: string): string | null {
  const words = tokenizeWithOriginalText(sourceText);
  const anchorWords = tokenizeWithOriginalText(anchor).map((token) => token.normalized);
  if (words.length === 0 || anchorWords.length === 0) {
    return null;
  }

  let start = -1;
  for (let i = 0; i <= words.length - anchorWords.length; i += 1) {
    if (
      words
        .slice(i, i + anchorWords.length)
        .map((token) => token.normalized)
        .join(" ") === anchorWords.join(" ")
    ) {
      start = i;
      break;
    }
  }
  if (start === -1) {
    return null;
  }

  const end = start + anchorWords.length - 1;
  const repaired: string[] = [];

  for (let size = 2; size <= 5; size += 1) {
    for (let left = Math.max(0, end - size + 1); left <= start; left += 1) {
      const right = left + size - 1;
      if (right >= words.length || left > start || right < end) {
        continue;
      }
      const phrase = repairCandidateAnchor(
        normalizeWhitespace(words.slice(left, right + 1).map((token) => token.raw).join(" ")),
      );
      repaired.push(phrase);
    }
  }

  for (const phrase of repaired) {
    if (isHumanQualityAnchor(phrase)) {
      return phrase;
    }
  }

  return null;
}

function generateTopicFallbackAnchor(target: SitePageTopicProfile, brandCandidates: Set<string>): string | null {
  const topicSignals = [
    normalizeWhitespace(target.topicPhrases.find((phrase) => phrase.source === "title")?.phrase ?? ""),
    normalizeWhitespace(target.primaryTopic),
    normalizeWhitespace(target.h1),
  ].filter(Boolean);

  const candidates = new Set<string>();

  for (const signal of topicSignals) {
    const words = tokenizeWithOriginalText(signal).map((token) => token.raw).filter(Boolean);
    if (words.length >= 2) {
      candidates.add(normalizeWhitespace(words.slice(0, 2).join(" ")));
      candidates.add(normalizeWhitespace(words.slice(0, 3).join(" ")));
    }
    if (words.length >= 3) {
      candidates.add(normalizeWhitespace(words.slice(1, 4).join(" ")));
    }
  }

  for (const candidate of candidates) {
    const repaired = repairCandidateAnchor(candidate);
    if (!isHumanQualityAnchor(repaired)) {
      continue;
    }
    if (isBrandLike(repaired, brandCandidates) && !isHomepageOrAboutTarget(target.url)) {
      continue;
    }
    return repaired;
  }

  return null;
}

export function suggestAnchorText(
  sourceText: string,
  target: SitePageTopicProfile,
  options: SuggestAnchorTextOptions = {},
): AnchorSuggestion | null {
  const blockedAnchors =
    options.blockedAnchors instanceof Set
      ? new Set([...options.blockedAnchors].map((value) => normalizeAnchor(value)))
      : new Set((options.blockedAnchors ?? []).map((value) => normalizeAnchor(value)));
  const brandCandidates =
    options.brandCandidates instanceof Set
      ? options.brandCandidates
      : new Set((options.brandCandidates ?? []).map((value) => normalizeAnchor(value)));
  const sourcePageType = options.sourcePageType ?? "generic";

  // Stage 1: extract candidate noun/topic phrases from full context sentence.
  const rawCandidates = extractCandidateNounPhrasesFromSentence(sourceText);
  const rejected: RejectedCandidate[] = [];
  const scored: CandidateScore[] = [];

  // Stage 2 + 3: reject invalid, repair if needed, score to target.
  for (const raw of rawCandidates) {
    let candidate = repairCandidateAnchor(raw);
    let validation = validateAnchorDetailed(candidate);

    if (!validation.valid) {
      const repaired = expandBrokenPhraseWithinSentence(sourceText, candidate);
      if (repaired) {
        candidate = repairCandidateAnchor(repaired);
        validation = validateAnchorDetailed(candidate);
      }
    }

    if (!validation.valid) {
      rejected.push({ anchor: raw, reasons: validation.reasons });
      logAnchorRejected(raw, validation.reasons);
      continue;
    }

    if (blockedAnchors.has(normalizeAnchorForCompare(candidate))) {
      continue;
    }

    if (isBrandLike(candidate, brandCandidates) && !isHomepageOrAboutTarget(target.url)) {
      rejected.push({ anchor: raw, reasons: ["brand-only-non-home-about"] });
      logAnchorRejected(raw, ["brand-only-non-home-about"]);
      continue;
    }

    scored.push({
      anchor: candidate,
      score: scoreAgainstTarget(candidate, target, sourcePageType),
      phraseSource: "body_term",
      matchType: "close",
      phraseWeight: 0.84,
    });
  }

  scored.sort((a, b) => b.score - a.score || b.anchor.length - a.anchor.length);

  let selected = scored[0] ?? null;

  // Stage 4: smart fallback from target topic only if needed.
  if (!selected) {
    const fallback = generateTopicFallbackAnchor(target, brandCandidates);
    if (fallback && isHumanQualityAnchor(fallback) && !blockedAnchors.has(normalizeAnchor(fallback))) {
      selected = {
        anchor: fallback,
        score: 1,
        phraseSource: "title",
        matchType: "fallback",
        phraseWeight: 0.62,
      };
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[internal-linking][anchor-debug]", {
      detectedPageType: sourcePageType,
      contextSentence: sourceText,
      candidatePhrases: scored.map((item) => item.anchor),
      rejectedPhrases: rejected,
      selectedAnchor: selected?.anchor ?? null,
      targetPageTopic: target.primaryTopic,
    });
  }

  // Stage 5: final validation gate.
  if (!selected || !isHumanQualityAnchor(selected.anchor)) {
    if (selected) {
      const finalValidation = validateAnchorDetailed(selected.anchor);
      logAnchorRejected(selected.anchor, finalValidation.reasons);
    }
    return null;
  }

  return {
    anchor: selected.anchor,
    matchType: selected.matchType,
    phraseSource: selected.phraseSource,
    phraseWeight: selected.phraseWeight,
  };
}
