"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyseSiteTopics = analyseSiteTopics;
const shared_1 = require("./shared");
const urlCompare_1 = require("./urlCompare");
function dedupeComparableStrings(values) {
    const seen = new Set();
    const deduped = [];
    for (const value of values) {
        if (!value || seen.has(value)) {
            continue;
        }
        seen.add(value);
        deduped.push(value);
    }
    return deduped;
}
function dedupeInternalLinkEntries(entries) {
    const seen = new Set();
    const deduped = [];
    for (const entry of entries) {
        const key = `${entry.normalizedUrl}|${entry.normalizedAnchorText}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        deduped.push(entry);
    }
    return deduped;
}
function choosePrimaryTopic(page) {
    var _a;
    const candidates = [page.h1, ...(0, shared_1.titleParts)(page.title), ...page.h2s]
        .map((candidate) => (0, shared_1.normalizeWhitespace)(candidate))
        .filter((candidate) => candidate.length >= 8);
    return (_a = candidates[0]) !== null && _a !== void 0 ? _a : (0, shared_1.buildPageDisplayTitle)(page);
}
function buildTopicPhrases(page) {
    const phrases = [];
    const addPhrase = (phrase, source, weight) => {
        const clean = (0, shared_1.normalizeWhitespace)(phrase);
        if (clean.length < 4) {
            return;
        }
        phrases.push({ phrase: clean, source, weight });
    };
    for (const phrase of (0, shared_1.titleParts)(page.title)) {
        addPhrase(phrase, "title", 1);
    }
    addPhrase(page.h1, "h1", 0.98);
    for (const h2 of page.h2s) {
        addPhrase(h2, "h2", 0.88);
    }
    for (const phrase of (0, shared_1.repeatedBodyPhrases)(page.bodyText, 10)) {
        addPhrase(phrase, "body_term", 0.58);
    }
    for (const term of (0, shared_1.topTermsFromBody)(page.bodyText, 6)) {
        addPhrase(term, "body_term", 0.42);
    }
    const bestWeightByPhrase = new Map();
    for (const entry of phrases) {
        const key = entry.phrase.toLowerCase();
        const existing = bestWeightByPhrase.get(key);
        if (!existing || existing.weight < entry.weight) {
            bestWeightByPhrase.set(key, entry);
        }
    }
    return [...bestWeightByPhrase.values()]
        .sort((a, b) => b.weight - a.weight || b.phrase.length - a.phrase.length)
        .slice(0, 18);
}
function buildBodyContexts(page) {
    const contexts = [];
    let position = 0;
    for (const section of page.contentSections) {
        const normalizedSectionText = (0, shared_1.normalizeWhitespace)(section.text);
        const sectionLabel = section.label || "Body content";
        if (normalizedSectionText.length >= 32) {
            contexts.push({
                text: normalizedSectionText,
                sectionLabel,
                blockType: section.type,
                position,
            });
            position += 1;
        }
        for (const sentence of (0, shared_1.splitIntoSentences)(normalizedSectionText)) {
            if (sentence.length < 32) {
                continue;
            }
            contexts.push({
                text: sentence,
                sectionLabel,
                blockType: section.type,
                position,
            });
            position += 1;
        }
    }
    const seen = new Set();
    const deduped = contexts.filter((context) => {
        const key = (0, shared_1.normalizeWhitespace)(context.text).toLowerCase();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
    return deduped.slice(0, 220);
}
function inferPageType(page) {
    const urlPath = new URL(page.url).pathname.toLowerCase();
    const signals = `${page.title} ${page.h1} ${page.h2s.join(" ")} ${urlPath}`.toLowerCase();
    if (urlPath === "/") {
        return "homepage";
    }
    const profileSignals = [
        "/about",
        "/team",
        "/profile",
        "about us",
        "our team",
        "profile",
        "biography",
        "who we are",
    ];
    if (profileSignals.some((signal) => signals.includes(signal))) {
        return "profile";
    }
    const blogSignals = ["blog", "news", "guide", "article", "how to", "tips", "resources"];
    if (blogSignals.some((signal) => signals.includes(signal))) {
        return "blog";
    }
    const ecommerceSignals = [
        "product",
        "products",
        "shop",
        "category",
        "collection",
        "sku",
        "cart",
        "checkout",
        "buy",
    ];
    if (ecommerceSignals.some((signal) => signals.includes(signal))) {
        return "ecommerce";
    }
    const serviceSignals = [
        "service",
        "services",
        "agency",
        "consult",
        "consulting",
        "specialist",
        "law",
        "mediation",
        "support",
        "solutions",
    ];
    if (serviceSignals.some((signal) => signals.includes(signal))) {
        return "service";
    }
    return "generic";
}
function analyseSiteTopics(pages) {
    var _a, _b;
    const inboundCounts = new Map();
    for (const page of pages) {
        for (const link of page.existingInternalLinks) {
            const normalizedTarget = (0, urlCompare_1.normalizeUrlForCompare)(link.normalizedUrl || link.resolvedUrl || link.href, page.url);
            if (!normalizedTarget) {
                continue;
            }
            inboundCounts.set(normalizedTarget, ((_a = inboundCounts.get(normalizedTarget)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
    }
    const profiles = pages
        .filter((page) => page.indexable &&
        page.statusCode >= 200 &&
        page.statusCode < 400 &&
        page.bodyText.length >= 80)
        .map((page) => {
        var _a;
        const comparablePageUrl = (0, urlCompare_1.normalizeUrlForCompare)(page.url);
        const existingInternalLinkEntries = dedupeInternalLinkEntries(page.existingInternalLinks
            .map((link) => {
            const normalizedTarget = (0, urlCompare_1.normalizeUrlForCompare)(link.normalizedUrl || link.resolvedUrl || link.href, page.url);
            if (!normalizedTarget) {
                return null;
            }
            const anchorText = (0, shared_1.normalizeWhitespace)(link.text);
            return {
                normalizedUrl: normalizedTarget,
                anchorText,
                normalizedAnchorText: (0, urlCompare_1.normalizeAnchorTextForCompare)(anchorText),
            };
        })
            .filter((entry) => entry !== null));
        return {
            url: page.url,
            canonicalUrl: page.canonical,
            title: (0, shared_1.buildPageDisplayTitle)(page),
            h1: page.h1,
            h2s: page.h2s,
            primaryTopic: choosePrimaryTopic(page),
            topicPhrases: buildTopicPhrases(page),
            keywords: (0, shared_1.dedupeStrings)((0, shared_1.topTermsFromBody)(page.bodyText, 12)),
            bodyContexts: buildBodyContexts(page),
            contentDebug: page.contentDebug,
            existingInternalLinkTargets: dedupeComparableStrings(existingInternalLinkEntries.map((entry) => entry.normalizedUrl)),
            existingInternalLinkEntries,
            inboundInternalLinkCount: comparablePageUrl
                ? ((_a = inboundCounts.get(comparablePageUrl)) !== null && _a !== void 0 ? _a : 0)
                : 0,
            outboundInternalLinkCount: page.existingInternalLinks.length,
            commerciallyImportant: (0, shared_1.isCommercialPage)(page),
            pageType: inferPageType(page),
            indexable: page.indexable,
        };
    });
    const phrasePageFrequency = new Map();
    for (const profile of profiles) {
        const seenOnPage = new Set();
        for (const phrase of profile.topicPhrases) {
            const key = (0, shared_1.normalizePhrase)(phrase.phrase);
            if (!key || seenOnPage.has(key)) {
                continue;
            }
            seenOnPage.add(key);
            phrasePageFrequency.set(key, ((_b = phrasePageFrequency.get(key)) !== null && _b !== void 0 ? _b : 0) + 1);
        }
    }
    const profileCount = profiles.length;
    return profiles.map((profile) => {
        const primaryTopicTokens = new Set((0, shared_1.tokenize)(profile.primaryTopic));
        const filteredTopicPhrases = profile.topicPhrases.filter((phrase) => {
            var _a;
            const key = (0, shared_1.normalizePhrase)(phrase.phrase);
            const frequency = (_a = phrasePageFrequency.get(key)) !== null && _a !== void 0 ? _a : 0;
            const frequencyRatio = profileCount > 0 ? frequency / profileCount : 0;
            const appearsTooWidely = frequency >= 3 && frequencyRatio >= 0.45;
            if (!appearsTooWidely) {
                return true;
            }
            const phraseTokens = (0, shared_1.tokenize)(phrase.phrase);
            const overlap = phraseTokens.filter((token) => primaryTopicTokens.has(token)).length;
            return overlap >= 2;
        });
        return Object.assign(Object.assign({}, profile), { topicPhrases: filteredTopicPhrases.length > 0
                ? filteredTopicPhrases
                : profile.topicPhrases.slice(0, 8) });
    });
}
