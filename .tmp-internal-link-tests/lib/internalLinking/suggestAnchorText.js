"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidAnchor = isValidAnchor;
exports.isHumanQualityAnchor = isHumanQualityAnchor;
exports.suggestAnchorText = suggestAnchorText;
const shared_1 = require("./shared");
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
function normalizeAnchor(value) {
    const standardized = value.replace(/[’]/g, "'");
    return (0, shared_1.normalizeWhitespace)(standardized.toLowerCase().replace(/[^a-z0-9\s'&-]+/g, " "));
}
function normalizeAnchorForCompare(value) {
    return normalizeAnchor(value).replace(/[’]/g, "'");
}
function restorePossessiveApostrophes(value) {
    return (0, shared_1.normalizeWhitespace)(value).replace(/\b([A-Za-z]+)\s+s\b/g, "$1’s");
}
function isBrandLike(anchor, brandCandidates) {
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
function isHomepageOrAboutTarget(targetUrl) {
    try {
        const pathname = new URL(targetUrl).pathname.toLowerCase();
        return pathname === "/" || /\/about(?:[-_/]|$)/.test(pathname);
    }
    catch (_a) {
        return false;
    }
}
function validateAnchorDetailed(anchor) {
    const normalized = normalizeAnchorForCompare(anchor);
    const words = normalized.split(/\s+/).filter(Boolean);
    const reasons = [];
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
    const meaningfulNounish = words.filter((word) => word.length >= 4 && !FRAGMENT_WORDS.has(word) && !WEAK_VERBS.has(word));
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
function isValidAnchor(anchor) {
    return validateAnchorDetailed(anchor).valid;
}
function isHumanQualityAnchor(anchor) {
    return validateAnchorDetailed(anchor).valid;
}
function logAnchorRejected(anchor, reasons) {
    console.debug("[internal-linking][anchor-rejected]", { original: anchor, reasons });
}
function tokenizeWords(sourceText) {
    var _a;
    return ((_a = sourceText.match(/[a-z0-9'&-]+/gi)) !== null && _a !== void 0 ? _a : []).map((word) => normalizeAnchor(word));
}
function tokenizeWithOriginalText(sourceText) {
    var _a;
    const matches = (_a = sourceText.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)?|&/g)) !== null && _a !== void 0 ? _a : [];
    return matches.map((raw) => ({
        raw,
        normalized: normalizeAnchorForCompare(raw),
    }));
}
function repairCandidateAnchor(anchor) {
    const repairedPossessive = restorePossessiveApostrophes(anchor);
    return (0, shared_1.normalizeWhitespace)(repairedPossessive);
}
function extractCandidateNounPhrasesFromSentence(sourceText) {
    var _a, _b;
    const tokens = tokenizeWithOriginalText(sourceText);
    const candidates = new Set();
    for (let size = 2; size <= 5; size += 1) {
        for (let i = 0; i <= tokens.length - size; i += 1) {
            const window = tokens.slice(i, i + size);
            const normalizedWindow = window.map((token) => token.normalized);
            if (normalizedWindow.some((word) => !word ||
                SENTENCE_VERBS.has(word) ||
                CONTACT_TERMS.has(word) ||
                PRONOUNS.has(word) ||
                /\d/.test(word))) {
                continue;
            }
            const first = (_a = normalizedWindow[0]) !== null && _a !== void 0 ? _a : "";
            const last = (_b = normalizedWindow[normalizedWindow.length - 1]) !== null && _b !== void 0 ? _b : "";
            if (EDGE_STOPWORDS.has(first) || EDGE_STOPWORDS.has(last) || CONNECTOR_WORDS.has(last)) {
                continue;
            }
            if (normalizedWindow.length >= 3 &&
                normalizedWindow.some((word, index) => index > 0 && index < normalizedWindow.length - 1 && CONNECTOR_WORDS.has(word))) {
                continue;
            }
            const phraseRaw = (0, shared_1.normalizeWhitespace)(window.map((token) => token.raw).join(" "));
            const phrase = repairCandidateAnchor(phraseRaw);
            if (!phrase) {
                continue;
            }
            candidates.add(phrase);
        }
    }
    return [...candidates];
}
function scoreAgainstTarget(candidate, target, sourcePageType) {
    const candidateTokens = new Set((0, shared_1.tokenizeStemmed)(candidate));
    const targetTitleTokens = new Set((0, shared_1.tokenizeStemmed)(target.title));
    const targetSlugTokens = new Set((0, shared_1.tokenizeStemmed)(new URL(target.url).pathname));
    const targetHeadingTokens = new Set((0, shared_1.tokenizeStemmed)(`${target.h1} ${target.h2s.join(" ")}`));
    const overlap = (a, b) => [...a].filter((token) => b.has(token)).length;
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
        if (normalizedCandidate === topic ||
            normalizedCandidate === h1 ||
            title.includes(normalizedCandidate)) {
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
    return (titleMatch * 6 +
        slugMatch * 7 +
        headingMatch * 5 +
        nounishScore * 2 +
        lengthScore * 2 +
        pageTypeBoost * 3 +
        overlapRatio * 8 +
        exactPhraseBoost -
        connectorCount * 2.5);
}
function expandBrokenPhraseWithinSentence(sourceText, anchor) {
    const words = tokenizeWithOriginalText(sourceText);
    const anchorWords = tokenizeWithOriginalText(anchor).map((token) => token.normalized);
    if (words.length === 0 || anchorWords.length === 0) {
        return null;
    }
    let start = -1;
    for (let i = 0; i <= words.length - anchorWords.length; i += 1) {
        if (words
            .slice(i, i + anchorWords.length)
            .map((token) => token.normalized)
            .join(" ") === anchorWords.join(" ")) {
            start = i;
            break;
        }
    }
    if (start === -1) {
        return null;
    }
    const end = start + anchorWords.length - 1;
    const repaired = [];
    for (let size = 2; size <= 5; size += 1) {
        for (let left = Math.max(0, end - size + 1); left <= start; left += 1) {
            const right = left + size - 1;
            if (right >= words.length || left > start || right < end) {
                continue;
            }
            const phrase = repairCandidateAnchor((0, shared_1.normalizeWhitespace)(words.slice(left, right + 1).map((token) => token.raw).join(" ")));
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
function generateTopicFallbackAnchor(target, brandCandidates) {
    var _a, _b;
    const topicSignals = [
        (0, shared_1.normalizeWhitespace)((_b = (_a = target.topicPhrases.find((phrase) => phrase.source === "title")) === null || _a === void 0 ? void 0 : _a.phrase) !== null && _b !== void 0 ? _b : ""),
        (0, shared_1.normalizeWhitespace)(target.primaryTopic),
        (0, shared_1.normalizeWhitespace)(target.h1),
    ].filter(Boolean);
    const candidates = new Set();
    for (const signal of topicSignals) {
        const words = tokenizeWithOriginalText(signal).map((token) => token.raw).filter(Boolean);
        if (words.length >= 2) {
            candidates.add((0, shared_1.normalizeWhitespace)(words.slice(0, 2).join(" ")));
            candidates.add((0, shared_1.normalizeWhitespace)(words.slice(0, 3).join(" ")));
        }
        if (words.length >= 3) {
            candidates.add((0, shared_1.normalizeWhitespace)(words.slice(1, 4).join(" ")));
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
function suggestAnchorText(sourceText, target, options = {}) {
    var _a, _b, _c, _d, _e;
    const blockedAnchors = options.blockedAnchors instanceof Set
        ? new Set([...options.blockedAnchors].map((value) => normalizeAnchor(value)))
        : new Set(((_a = options.blockedAnchors) !== null && _a !== void 0 ? _a : []).map((value) => normalizeAnchor(value)));
    const brandCandidates = options.brandCandidates instanceof Set
        ? options.brandCandidates
        : new Set(((_b = options.brandCandidates) !== null && _b !== void 0 ? _b : []).map((value) => normalizeAnchor(value)));
    const sourcePageType = (_c = options.sourcePageType) !== null && _c !== void 0 ? _c : "generic";
    // Stage 1: extract candidate noun/topic phrases from full context sentence.
    const rawCandidates = extractCandidateNounPhrasesFromSentence(sourceText);
    const rejected = [];
    const scored = [];
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
    let selected = (_d = scored[0]) !== null && _d !== void 0 ? _d : null;
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
            selectedAnchor: (_e = selected === null || selected === void 0 ? void 0 : selected.anchor) !== null && _e !== void 0 ? _e : null,
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
