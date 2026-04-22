import type { SitePageSnapshot } from "../crawler";

const STOPWORDS = new Set([
  "a",
  "about",
  "after",
  "all",
  "also",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "between",
  "both",
  "but",
  "by",
  "can",
  "could",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "more",
  "most",
  "no",
  "not",
  "of",
  "on",
  "or",
  "our",
  "out",
  "over",
  "that",
  "the",
  "their",
  "there",
  "these",
  "this",
  "to",
  "up",
  "was",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
]);

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizePhrase(value: string): string {
  return normalizeWhitespace(value.toLowerCase().replace(/[^a-z0-9\s/-]/g, " "));
}

export function stemToken(token: string): string {
  const clean = normalizePhrase(token);

  if (clean.endsWith("ies") && clean.length > 4) {
    return `${clean.slice(0, -3)}y`;
  }

  if (clean.endsWith("ing") && clean.length > 5) {
    return clean.slice(0, -3);
  }

  if (clean.endsWith("ed") && clean.length > 4) {
    return clean.slice(0, -2);
  }

  if (clean.endsWith("es") && clean.length > 4) {
    return clean.slice(0, -2);
  }

  if (clean.endsWith("s") && clean.length > 3) {
    return clean.slice(0, -1);
  }

  return clean;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function tokenize(value: string): string[] {
  const normalized = normalizePhrase(value);
  const splitTokens = normalized
    .split(/[\s/-]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
  const collapsedCompoundTokens = (normalized.match(/[a-z0-9]+(?:[-/][a-z0-9]+)+/g) ?? [])
    .map((token) => token.replace(/[-/]/g, ""))
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));

  return [...new Set([...splitTokens, ...collapsedCompoundTokens])];
}

export function tokenizeStemmed(value: string): string[] {
  return tokenize(value).map(stemToken);
}

export function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const clean = normalizeWhitespace(value);
    const normalized = normalizePhrase(clean);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    deduped.push(clean);
  }

  return deduped;
}

export function titleParts(value: string): string[] {
  return dedupeStrings(
    value
      .split(/[|:,-]/)
      .map((part) => normalizeWhitespace(part))
      .filter((part) => part.length >= 4),
  );
}

export function splitIntoSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter((sentence) => sentence.length >= 45);
}

export function buildPageDisplayTitle(page: SitePageSnapshot): string {
  return page.title || page.h1 || page.url;
}

export function urlPathDepth(url: string): number {
  const parsed = new URL(url);
  return parsed.pathname.split("/").filter(Boolean).length;
}

export function isCommercialPage(page: SitePageSnapshot): boolean {
  const signals = [page.title, page.h1, ...page.h2s, new URL(page.url).pathname]
    .join(" ")
    .toLowerCase();
  const commercialKeywords = [
    "service",
    "services",
    "seo",
    "audit",
    "pricing",
    "contact",
    "agency",
    "consult",
    "design",
    "marketing",
    "solution",
  ];

  return (
    urlPathDepth(page.url) <= 2 ||
    commercialKeywords.some((keyword) => signals.includes(keyword))
  );
}

export function topTermsFromBody(value: string, limit = 8): string[] {
  const counts = new Map<string, number>();

  for (const token of tokenize(value)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

export function repeatedBodyPhrases(value: string, limit = 10): string[] {
  const tokens = tokenize(value);
  const counts = new Map<string, number>();

  for (let size = 2; size <= 4; size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const phrase = tokens.slice(index, index + size).join(" ");

      if (phrase.length < 8) {
        continue;
      }

      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([phrase]) => phrase);
}

export function containsPhrase(text: string, phrase: string): boolean {
  const normalizedPhrase = normalizePhrase(phrase);

  if (!normalizedPhrase) {
    return false;
  }

  const regex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedPhrase)}([^a-z0-9]|$)`, "i");
  return regex.test(normalizePhrase(text));
}

export function findPhraseMatch(text: string, phrase: string): string | null {
  const normalizedText = normalizeWhitespace(text);
  const tokens = tokenize(phrase);

  if (tokens.length === 0) {
    return null;
  }

  const flexiblePattern = tokens.map((token) => escapeRegExp(token)).join("[^a-z0-9]+");
  const regex = new RegExp(`(^|[^a-z0-9])(${flexiblePattern})([^a-z0-9]|$)`, "i");
  const match = normalizedText.match(regex);

  if (match?.[2]) {
    return normalizeWhitespace(match[2]);
  }

  if (tokens.length > 1) {
    const stemmedTextTokens = tokenizeStemmed(text);
    const stemmedPhraseTokens = tokenizeStemmed(phrase);

    for (let index = 0; index <= stemmedTextTokens.length - stemmedPhraseTokens.length; index += 1) {
      const window = stemmedTextTokens.slice(index, index + stemmedPhraseTokens.length);

      if (window.join(" ") === stemmedPhraseTokens.join(" ")) {
        const sourceWords = normalizedText.split(/\s+/);
        return normalizeWhitespace(
          sourceWords.slice(index, index + stemmedPhraseTokens.length).join(" "),
        );
      }
    }
  }

  return null;
}

export function isWeakTopicPhrase(phrase: string): boolean {
  const tokens = tokenize(phrase);
  return tokens.length === 0 || (tokens.length === 1 && phrase.trim().length < 10);
}

export function phraseWordOverlap(text: string, phrase: string): number {
  const textTokens = new Set(tokenizeStemmed(text));
  const phraseTokens = tokenizeStemmed(phrase);

  if (phraseTokens.length === 0) {
    return 0;
  }

  const matched = phraseTokens.filter((token) => textTokens.has(token)).length;
  return matched / phraseTokens.length;
}

export function findClosePhraseMatches(text: string, phrase: string, maxMatches = 3): string[] {
  const sourceWords = normalizeWhitespace(text).split(/\s+/);
  const sourceWordKeys = sourceWords.map((word) => stemToken(word));
  const phraseWords = tokenizeStemmed(phrase);

  if (phraseWords.length === 0) {
    return [];
  }

  const matches: string[] = [];
  const seen = new Set<string>();
  const minWindow = Math.max(1, phraseWords.length - 1);
  const maxWindow = phraseWords.length + 2;

  for (let windowSize = minWindow; windowSize <= maxWindow; windowSize += 1) {
    for (let index = 0; index <= sourceWordKeys.length - windowSize; index += 1) {
      const windowKeys = sourceWordKeys.slice(index, index + windowSize);
      const overlap =
        phraseWords.filter((token) => windowKeys.includes(token)).length / phraseWords.length;

      if (overlap < 0.8) {
        continue;
      }

      const candidate = normalizeWhitespace(sourceWords.slice(index, index + windowSize).join(" "));

      if (candidate.length < 4 || seen.has(candidate.toLowerCase())) {
        continue;
      }

      seen.add(candidate.toLowerCase());
      matches.push(candidate);

      if (matches.length >= maxMatches) {
        return matches;
      }
    }
  }

  return matches;
}

export function buildSnippet(text: string, anchor: string, maxLength = 190): string {
  const cleanText = normalizeWhitespace(text);
  const lowerText = cleanText.toLowerCase();
  const lowerAnchor = anchor.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerAnchor);

  if (matchIndex === -1 || cleanText.length <= maxLength) {
    return cleanText;
  }

  const start = Math.max(0, matchIndex - 70);
  const end = Math.min(cleanText.length, matchIndex + anchor.length + 70);
  const prefix = start > 0 ? "... " : "";
  const suffix = end < cleanText.length ? " ..." : "";

  return `${prefix}${cleanText.slice(start, end).trim()}${suffix}`;
}
