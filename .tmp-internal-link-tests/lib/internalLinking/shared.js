"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWhitespace = normalizeWhitespace;
exports.normalizePhrase = normalizePhrase;
exports.stemToken = stemToken;
exports.escapeRegExp = escapeRegExp;
exports.tokenize = tokenize;
exports.tokenizeStemmed = tokenizeStemmed;
exports.dedupeStrings = dedupeStrings;
exports.titleParts = titleParts;
exports.splitIntoSentences = splitIntoSentences;
exports.buildPageDisplayTitle = buildPageDisplayTitle;
exports.urlPathDepth = urlPathDepth;
exports.isCommercialPage = isCommercialPage;
exports.topTermsFromBody = topTermsFromBody;
exports.repeatedBodyPhrases = repeatedBodyPhrases;
exports.containsPhrase = containsPhrase;
exports.findPhraseMatch = findPhraseMatch;
exports.isWeakTopicPhrase = isWeakTopicPhrase;
exports.phraseWordOverlap = phraseWordOverlap;
exports.findClosePhraseMatches = findClosePhraseMatches;
exports.buildSnippet = buildSnippet;
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
function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
function normalizePhrase(value) {
    return normalizeWhitespace(value.toLowerCase().replace(/[^a-z0-9\s/-]/g, " "));
}
function stemToken(token) {
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
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function tokenize(value) {
    var _a;
    const normalized = normalizePhrase(value);
    const splitTokens = normalized
        .split(/[\s/-]+/)
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
    const collapsedCompoundTokens = ((_a = normalized.match(/[a-z0-9]+(?:[-/][a-z0-9]+)+/g)) !== null && _a !== void 0 ? _a : [])
        .map((token) => token.replace(/[-/]/g, ""))
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
    return [...new Set([...splitTokens, ...collapsedCompoundTokens])];
}
function tokenizeStemmed(value) {
    return tokenize(value).map(stemToken);
}
function dedupeStrings(values) {
    const seen = new Set();
    const deduped = [];
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
function titleParts(value) {
    return dedupeStrings(value
        .split(/[|:,-]/)
        .map((part) => normalizeWhitespace(part))
        .filter((part) => part.length >= 4));
}
function splitIntoSentences(value) {
    return value
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => normalizeWhitespace(sentence))
        .filter((sentence) => sentence.length >= 45);
}
function buildPageDisplayTitle(page) {
    return page.title || page.h1 || page.url;
}
function urlPathDepth(url) {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean).length;
}
function isCommercialPage(page) {
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
    return (urlPathDepth(page.url) <= 2 ||
        commercialKeywords.some((keyword) => signals.includes(keyword)));
}
function topTermsFromBody(value, limit = 8) {
    var _a;
    const counts = new Map();
    for (const token of tokenize(value)) {
        counts.set(token, ((_a = counts.get(token)) !== null && _a !== void 0 ? _a : 0) + 1);
    }
    return [...counts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([term]) => term);
}
function repeatedBodyPhrases(value, limit = 10) {
    var _a;
    const tokens = tokenize(value);
    const counts = new Map();
    for (let size = 2; size <= 4; size += 1) {
        for (let index = 0; index <= tokens.length - size; index += 1) {
            const phrase = tokens.slice(index, index + size).join(" ");
            if (phrase.length < 8) {
                continue;
            }
            counts.set(phrase, ((_a = counts.get(phrase)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
    }
    return [...counts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
        .slice(0, limit)
        .map(([phrase]) => phrase);
}
function containsPhrase(text, phrase) {
    const normalizedPhrase = normalizePhrase(phrase);
    if (!normalizedPhrase) {
        return false;
    }
    const regex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedPhrase)}([^a-z0-9]|$)`, "i");
    return regex.test(normalizePhrase(text));
}
function findPhraseMatch(text, phrase) {
    const normalizedText = normalizeWhitespace(text);
    const tokens = tokenize(phrase);
    if (tokens.length === 0) {
        return null;
    }
    const flexiblePattern = tokens.map((token) => escapeRegExp(token)).join("[^a-z0-9]+");
    const regex = new RegExp(`(^|[^a-z0-9])(${flexiblePattern})([^a-z0-9]|$)`, "i");
    const match = normalizedText.match(regex);
    if (match === null || match === void 0 ? void 0 : match[2]) {
        return normalizeWhitespace(match[2]);
    }
    if (tokens.length > 1) {
        const stemmedTextTokens = tokenizeStemmed(text);
        const stemmedPhraseTokens = tokenizeStemmed(phrase);
        for (let index = 0; index <= stemmedTextTokens.length - stemmedPhraseTokens.length; index += 1) {
            const window = stemmedTextTokens.slice(index, index + stemmedPhraseTokens.length);
            if (window.join(" ") === stemmedPhraseTokens.join(" ")) {
                const sourceWords = normalizedText.split(/\s+/);
                return normalizeWhitespace(sourceWords.slice(index, index + stemmedPhraseTokens.length).join(" "));
            }
        }
    }
    return null;
}
function isWeakTopicPhrase(phrase) {
    const tokens = tokenize(phrase);
    return tokens.length === 0 || (tokens.length === 1 && phrase.trim().length < 10);
}
function phraseWordOverlap(text, phrase) {
    const textTokens = new Set(tokenizeStemmed(text));
    const phraseTokens = tokenizeStemmed(phrase);
    if (phraseTokens.length === 0) {
        return 0;
    }
    const matched = phraseTokens.filter((token) => textTokens.has(token)).length;
    return matched / phraseTokens.length;
}
function findClosePhraseMatches(text, phrase, maxMatches = 3) {
    const sourceWords = normalizeWhitespace(text).split(/\s+/);
    const sourceWordKeys = sourceWords.map((word) => stemToken(word));
    const phraseWords = tokenizeStemmed(phrase);
    if (phraseWords.length === 0) {
        return [];
    }
    const matches = [];
    const seen = new Set();
    const minWindow = Math.max(1, phraseWords.length - 1);
    const maxWindow = phraseWords.length + 2;
    for (let windowSize = minWindow; windowSize <= maxWindow; windowSize += 1) {
        for (let index = 0; index <= sourceWordKeys.length - windowSize; index += 1) {
            const windowKeys = sourceWordKeys.slice(index, index + windowSize);
            const overlap = phraseWords.filter((token) => windowKeys.includes(token)).length / phraseWords.length;
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
function buildSnippet(text, anchor, maxLength = 190) {
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
