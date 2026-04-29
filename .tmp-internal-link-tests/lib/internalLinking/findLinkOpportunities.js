"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLinkOpportunities = findLinkOpportunities;
const analyseSiteTopics_1 = require("./analyseSiteTopics");
const scoreOpportunity_1 = require("./scoreOpportunity");
const shared_1 = require("./shared");
const suggestAnchorText_1 = require("./suggestAnchorText");
const urlCompare_1 = require("./urlCompare");
const ANCHOR_INTENT_TERMS = new Set([
    "agency",
    "service",
    "services",
    "recruitment",
    "family law",
    "law",
    "mediation",
    "consultant",
    "consultants",
    "specialist",
    "specialists",
    "advice",
    "support",
    "seo",
    "audit",
    "design",
    "marketing",
]);
const GENERIC_ANCHOR_PHRASES = new Set([
    "click here",
    "read more",
    "learn more",
    "find out more",
    "related page link",
    "this page",
    "no strong anchor found",
]);
const MIN_ACTIONABLE_OPPORTUNITIES = 2;
function buildOpportunityId(sourceUrl, targetUrl, anchor) {
    const base = `${sourceUrl}|${targetUrl}|${anchor || "rewrite"}`
        .toLowerCase()
        .replace(/https?:\/\//g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `internal-link-${base}`.slice(0, 140);
}
function normalizeComparableUrl(url) {
    var _a;
    return (_a = (0, urlCompare_1.normalizeUrlForCompare)(url)) !== null && _a !== void 0 ? _a : url.trim().toLowerCase();
}
function inferBrandCandidates(pages) {
    var _a, _b, _c, _d, _e, _f;
    const candidates = new Set();
    const byPathDepth = [...pages].sort((a, b) => {
        const aDepth = new URL(a.url).pathname.split("/").filter(Boolean).length;
        const bDepth = new URL(b.url).pathname.split("/").filter(Boolean).length;
        return aDepth - bDepth;
    });
    const homepage = (_a = byPathDepth.find((page) => new URL(page.url).pathname === "/")) !== null && _a !== void 0 ? _a : byPathDepth[0];
    const pushCandidate = (value) => {
        const normalized = (0, urlCompare_1.normalizeAnchorTextForCompare)(value);
        if (!normalized || normalized.length < 3 || normalized.split(" ").length > 5) {
            return;
        }
        candidates.add(normalized);
    };
    if (homepage) {
        const homepageTitleLead = (_b = homepage.title.split(/[|:-]/)[0]) !== null && _b !== void 0 ? _b : homepage.title;
        pushCandidate(homepageTitleLead);
        pushCandidate(homepage.h1);
        pushCandidate(homepage.primaryTopic);
    }
    // Repeated page-title lead segments are usually brand markers across a site.
    const leadCounts = new Map();
    for (const page of pages) {
        const lead = (_c = page.title.split(/[|:-]/)[0]) !== null && _c !== void 0 ? _c : page.title;
        const normalizedLead = (0, urlCompare_1.normalizeAnchorTextForCompare)(lead);
        if (!normalizedLead || normalizedLead.length < 3) {
            continue;
        }
        leadCounts.set(normalizedLead, ((_d = leadCounts.get(normalizedLead)) !== null && _d !== void 0 ? _d : 0) + 1);
    }
    const repeatedLeads = [...leadCounts.entries()]
        .filter(([, count]) => count >= Math.max(2, Math.floor(pages.length * 0.3)))
        .map(([lead]) => lead);
    repeatedLeads.forEach((lead) => pushCandidate(lead));
    if (pages[0]) {
        try {
            const host = new URL(pages[0].url).hostname.replace(/^www\./i, "");
            const rootLabel = (_f = (_e = host.split(".")[0]) === null || _e === void 0 ? void 0 : _e.replace(/[-_]+/g, " ")) !== null && _f !== void 0 ? _f : "";
            pushCandidate(rootLabel);
        }
        catch (_g) {
            // ignore bad url
        }
    }
    return candidates;
}
function shouldDebugAnchorExample(sourceTitle, targetTitle, contextText) {
    if (process.env.NODE_ENV === "production") {
        return false;
    }
    const haystack = `${sourceTitle} ${targetTitle} ${contextText}`.toLowerCase();
    return (haystack.includes("spencer & james") ||
        (haystack.includes("recruitment") && haystack.includes("agency")));
}
function isAboutTarget(url) {
    try {
        return /\/about(?:[-_/]|$)/i.test(new URL(url).pathname);
    }
    catch (_a) {
        return false;
    }
}
function isHomepageTarget(url) {
    try {
        return new URL(url).pathname === "/";
    }
    catch (_a) {
        return false;
    }
}
function isBrandAnchor(anchor, brandCandidates) {
    if (!anchor) {
        return false;
    }
    const normalized = (0, urlCompare_1.normalizeAnchorTextForCompare)(anchor);
    if (!normalized) {
        return false;
    }
    if (brandCandidates.has(normalized)) {
        return true;
    }
    const normalizedCollapsed = normalized.replace(/[^a-z0-9]+/g, "");
    return [...brandCandidates].some((brand) => {
        const brandCollapsed = brand.replace(/[^a-z0-9]+/g, "");
        if (brandCollapsed.length < 4) {
            return false;
        }
        if (normalized === brand ||
            normalized.includes(`${brand} `) ||
            normalized.includes(` ${brand}`)) {
            return true;
        }
        if (normalizedCollapsed === brandCollapsed ||
            normalizedCollapsed.startsWith(brandCollapsed) ||
            normalizedCollapsed.includes(brandCollapsed)) {
            return true;
        }
        const brandTokens = brand.split(" ").filter(Boolean);
        const anchorTokens = normalized.split(" ").filter(Boolean);
        const overlap = brandTokens.filter((token) => anchorTokens.includes(token)).length;
        return overlap >= Math.max(1, brandTokens.length);
    });
}
function sourceAlreadyLinksToTarget(source, targetUrl) {
    const normalizedTarget = (0, urlCompare_1.normalizeUrlForCompare)(targetUrl);
    return Boolean(normalizedTarget && source.existingInternalLinkTargets.includes(normalizedTarget));
}
function sourceAlreadyLinksAnchorToTarget(source, targetUrl, anchor) {
    const normalizedTarget = (0, urlCompare_1.normalizeUrlForCompare)(targetUrl);
    const normalizedAnchor = (0, urlCompare_1.normalizeAnchorTextForCompare)(anchor);
    if (!normalizedTarget || !normalizedAnchor) {
        return false;
    }
    return source.existingInternalLinkEntries.some((entry) => entry.normalizedUrl === normalizedTarget &&
        entry.normalizedAnchorText === normalizedAnchor);
}
function sourceHasLinkedAnchorPhrase(source, anchor) {
    const normalizedAnchor = (0, urlCompare_1.normalizeAnchorTextForCompare)(anchor);
    if (!normalizedAnchor) {
        return false;
    }
    return source.existingInternalLinkEntries.some((entry) => entry.normalizedAnchorText === normalizedAnchor);
}
function getPairSkipReason(source, target) {
    if (source.url === target.url) {
        return "Skipped because source and target are the same page.";
    }
    if (sourceAlreadyLinksToTarget(source, target.url)) {
        return "Skipped: source already links to target.";
    }
    if (!source.indexable || !target.indexable) {
        return "Skipped because source or target is not indexable.";
    }
    const blockedTargetPathFragments = ["/404", "/not-found", "/error", "/page-not-found"];
    const targetPath = new URL(target.url).pathname.toLowerCase();
    if (blockedTargetPathFragments.some((fragment) => targetPath.includes(fragment))) {
        return "Skipped because target path is blocked.";
    }
    return null;
}
const GENERIC_TOPIC_TOKENS = new Set([
    "guide",
    "guides",
    "service",
    "services",
    "blog",
    "article",
    "overview",
    "information",
    "help",
    "legal",
    "law",
    "family",
    "team",
    "support",
    "advice",
    "solution",
    "solutions",
    "page",
]);
function hasStrongSourceTargetTopicFit(source, target) {
    var _a, _b, _c, _d;
    const sourceTitleCore = (_b = (_a = source.topicPhrases.find((phrase) => phrase.source === "title")) === null || _a === void 0 ? void 0 : _a.phrase) !== null && _b !== void 0 ? _b : "";
    const targetTitleCore = (_d = (_c = target.topicPhrases.find((phrase) => phrase.source === "title")) === null || _c === void 0 ? void 0 : _c.phrase) !== null && _d !== void 0 ? _d : "";
    const sourceTokens = new Set((0, shared_1.tokenize)(`${sourceTitleCore} ${source.h1} ${source.primaryTopic}`));
    const targetTokens = new Set((0, shared_1.tokenize)(`${targetTitleCore} ${target.h1} ${target.primaryTopic}`));
    if (sourceTokens.size === 0 || targetTokens.size === 0) {
        return true;
    }
    const overlap = [...sourceTokens].filter((token) => targetTokens.has(token));
    if (overlap.length >= 2) {
        return true;
    }
    if (overlap.some((token) => !GENERIC_TOPIC_TOKENS.has(token))) {
        return true;
    }
    const sourceTitleSignals = source.topicPhrases
        .filter((phrase) => phrase.source === "title" || phrase.source === "h1")
        .slice(0, 6);
    const targetSignalText = `${targetTitleCore} ${target.h1} ${target.primaryTopic}`;
    return sourceTitleSignals.some((phrase) => (0, shared_1.phraseWordOverlap)(targetSignalText, phrase.phrase) >= 0.8);
}
function buildPlacementHint(sectionLabel, anchor) {
    if (sectionLabel.toLowerCase().includes("introduction")) {
        return `Opening copy: link \"${anchor}\" where it first appears.`;
    }
    return `Paragraph under \"${sectionLabel}\".`;
}
function buildRewriteSuggestion(source, target) {
    var _a, _b, _c, _d, _e;
    const topicalAnchor = (_b = (_a = target.topicPhrases
        .map((phrase) => (0, urlCompare_1.normalizeAnchorTextForCompare)(phrase.phrase))
        .find((phrase) => {
        const words = phrase.split(" ").filter(Boolean).length;
        return words >= 2 && words <= 5 && !GENERIC_ANCHOR_PHRASES.has(phrase);
    })) !== null && _a !== void 0 ? _a : (0, urlCompare_1.normalizeAnchorTextForCompare)(target.primaryTopic)) !== null && _b !== void 0 ? _b : (0, urlCompare_1.normalizeAnchorTextForCompare)((_c = target.title.split(/[|:-]/)[0]) !== null && _c !== void 0 ? _c : target.title);
    const anchorHint = topicalAnchor && topicalAnchor.length >= 4 ? `"${topicalAnchor}"` : `"${target.title}"`;
    const sourceTopic = (_e = (_d = source.topicPhrases.find((phrase) => phrase.source === "title")) === null || _d === void 0 ? void 0 : _d.phrase) !== null && _e !== void 0 ? _e : source.primaryTopic;
    return `Rewrite one sentence in the "${sourceTopic}" section to naturally include ${anchorHint} and link to ${target.url}.`;
}
function buildReason(sourceTitle, targetTitle, anchor, scored) {
    if (!anchor) {
        return `A natural linked phrase is not yet present in body copy, but ${sourceTitle} and ${targetTitle} are strongly related.`;
    }
    return `\"${anchor}\" strongly aligns with ${sourceTitle} and points naturally to ${targetTitle}; topic fit ${Math.round(scored.signals.targetTopicAlignment * 100)}%, source-theme fit ${Math.round(scored.signals.sourceTopicAlignment * 100)}%.`;
}
function buildExpectedOutcome(anchor, source, target) {
    var _a, _b;
    const targetPath = new URL(target.url).pathname.toLowerCase();
    const targetTopic = (_b = (_a = target.topicPhrases.find((phrase) => phrase.source === "title")) === null || _a === void 0 ? void 0 : _a.phrase) !== null && _b !== void 0 ? _b : target.primaryTopic;
    const quotedTopic = `"${targetTopic}"`;
    if (!anchor) {
        return `Adds a clearer internal path between related topics and improves crawl depth toward ${target.title}.`;
    }
    if (source.pageType === "ecommerce" ||
        targetPath.includes("product") ||
        targetPath.includes("shop") ||
        targetPath.includes("category")) {
        return `Strengthens internal linking to this product/category page and improves crawl depth for ${quotedTopic}.`;
    }
    if (source.pageType === "blog") {
        return `Improves relevance for ${quotedTopic} and helps search engines connect informational intent across pages.`;
    }
    return `Supports ranking for ${quotedTopic} by reinforcing topical signals and helping search engines understand page focus.`;
}
function fallbackAnchorVariants(source, target) {
    var _a, _b, _c;
    const targetCore = (_c = (0, urlCompare_1.normalizeAnchorTextForCompare)((_b = (_a = target.topicPhrases.find((phrase) => phrase.source === "title")) === null || _a === void 0 ? void 0 : _a.phrase) !== null && _b !== void 0 ? _b : target.primaryTopic)) !== null && _c !== void 0 ? _c : "";
    const targetTokens = targetCore.split(" ").filter(Boolean);
    const variants = new Set();
    const pushIfValid = (value) => {
        const normalized = (0, urlCompare_1.normalizeAnchorTextForCompare)(value);
        const words = normalized.split(" ").filter(Boolean);
        if (words.length < 2 || words.length > 5) {
            return;
        }
        if (GENERIC_ANCHOR_PHRASES.has(normalized)) {
            return;
        }
        if (!(0, suggestAnchorText_1.isHumanQualityAnchor)(words.join(" "))) {
            return;
        }
        variants.add(words.join(" "));
    };
    pushIfValid(targetTokens.slice(0, 4).join(" "));
    pushIfValid(`${targetTokens.slice(0, 3).join(" ")} services`);
    pushIfValid(`${targetTokens.slice(0, 2).join(" ")} support`);
    pushIfValid(`${targetTokens.slice(0, 2).join(" ")} solutions`);
    pushIfValid(`${targetTokens.slice(0, 2).join(" ")}`);
    return [...variants].slice(0, 3);
}
function anchorAffinity(anchor, targetUrl, targetTitle) {
    if (!anchor) {
        return -1;
    }
    const anchorTokens = new Set((0, shared_1.tokenize)(anchor));
    if (anchorTokens.size === 0) {
        return 0;
    }
    const targetSignals = `${new URL(targetUrl).pathname} ${targetTitle}`;
    const targetTokens = new Set((0, shared_1.tokenize)(targetSignals));
    const overlap = [...anchorTokens].filter((token) => targetTokens.has(token)).length;
    return overlap;
}
function isBetterAnchorCandidate(next, current) {
    if (Boolean(next.suggestedAnchor) !== Boolean(current.suggestedAnchor)) {
        return Boolean(next.suggestedAnchor);
    }
    if (next.confidenceScore !== current.confidenceScore) {
        return next.confidenceScore > current.confidenceScore;
    }
    const nextAffinity = anchorAffinity(next.suggestedAnchor, next.targetUrl, next.targetTitle);
    const currentAffinity = anchorAffinity(current.suggestedAnchor, current.targetUrl, current.targetTitle);
    if (nextAffinity !== currentAffinity) {
        return nextAffinity > currentAffinity;
    }
    return next.targetTitle.length > current.targetTitle.length;
}
function hasUsableAnchor(value) {
    if (!value) {
        return false;
    }
    const normalized = (0, urlCompare_1.normalizeAnchorTextForCompare)(value);
    const words = normalized.split(" ").filter(Boolean).length;
    return (normalized.length >= 4 &&
        words >= 2 &&
        !GENERIC_ANCHOR_PHRASES.has(normalized) &&
        normalized !== "related page link");
}
function anchorKeywordAlignment(anchor, opportunity) {
    const anchorTokens = new Set((0, shared_1.tokenize)(anchor));
    const targetTokens = new Set((0, shared_1.tokenize)(`${opportunity.targetTitle} ${new URL(opportunity.targetUrl).pathname}`));
    if (anchorTokens.size === 0 || targetTokens.size === 0) {
        return 0;
    }
    const overlap = [...anchorTokens].filter((token) => targetTokens.has(token)).length;
    return overlap / Math.max(1, anchorTokens.size);
}
function anchorIntentScore(opportunity, brandCandidates) {
    if (!hasUsableAnchor(opportunity.suggestedAnchor)) {
        return -24;
    }
    const anchor = (0, urlCompare_1.normalizeAnchorTextForCompare)(opportunity.suggestedAnchor);
    const words = anchor.split(" ").filter(Boolean).length;
    const hasServiceTerm = [...ANCHOR_INTENT_TERMS].some((term) => anchor.includes(term));
    const isBrand = isBrandAnchor(anchor, brandCandidates);
    const isGeneric = GENERIC_ANCHOR_PHRASES.has(anchor);
    const targetPath = new URL(opportunity.targetUrl).pathname.toLowerCase();
    const isAboutOrHome = targetPath === "/" || /\/about(?:[-_/]|$)/i.test(targetPath);
    const alignment = anchorKeywordAlignment(opportunity.suggestedAnchor, opportunity);
    let score = 0;
    score += hasServiceTerm ? 18 : 0;
    score += words >= 2 && words <= 4 ? 12 : words === 5 ? 6 : -8;
    score += Math.round(alignment * 16);
    score += opportunity.opportunityType === "contextual" ? 6 : 0;
    score -= isBrand ? 28 : 0;
    score -= isGeneric ? 22 : 0;
    score -= isAboutOrHome ? 10 : 0;
    return score;
}
function rewriteStrengthForPair(source, target) {
    const relatedness = topicOverlapScore(source, target);
    // Rewrite-only suggestions are never high confidence.
    if (relatedness >= 46) {
        return { confidence: "Low", confidenceScore: 54 };
    }
    return null;
}
function recalibrateAnchorConfidence(scored, anchor, isBrand, targetUrl) {
    if (isBrand) {
        return {
            confidence: "Medium",
            confidenceScore: Math.min(72, Math.max(60, scored.score)),
        };
    }
    const sourceFit = scored.signals.sourceTopicAlignment;
    const targetFit = scored.signals.targetTopicAlignment;
    const combinedFit = sourceFit * 0.45 + targetFit * 0.55;
    const wordCount = anchor.split(/\s+/).filter(Boolean).length;
    const hasStrongLength = wordCount >= 2 && wordCount <= 5;
    const normalizedAnchor = (0, urlCompare_1.normalizeAnchorTextForCompare)(anchor);
    const hasServiceTerm = [...ANCHOR_INTENT_TERMS].some((term) => normalizedAnchor.includes(term));
    const isGeneric = GENERIC_ANCHOR_PHRASES.has(normalizedAnchor);
    const targetPath = new URL(targetUrl).pathname.toLowerCase();
    const isAboutOrHome = targetPath === "/" || /\/about(?:[-_/]|$)/i.test(targetPath);
    if (!isGeneric &&
        hasStrongLength &&
        hasServiceTerm &&
        !isAboutOrHome &&
        scored.score >= 78 &&
        targetFit >= 0.56 &&
        sourceFit >= 0.42 &&
        combinedFit >= 0.56) {
        return { confidence: "High", confidenceScore: Math.max(80, scored.score) };
    }
    if (scored.score >= 60 && targetFit >= 0.28 && sourceFit >= 0.22) {
        return { confidence: "Medium", confidenceScore: Math.min(77, Math.max(60, scored.score)) };
    }
    return { confidence: "Low", confidenceScore: Math.min(59, Math.max(46, scored.score)) };
}
function rewriteIntentKey(opportunity) {
    var _a, _b;
    const recommendationType = (_a = opportunity.recommendationType) !== null && _a !== void 0 ? _a : "rewrite";
    try {
        const pathname = new URL(opportunity.targetUrl).pathname
            .toLowerCase()
            .split("/")
            .filter(Boolean);
        const firstSegment = (_b = pathname[0]) !== null && _b !== void 0 ? _b : "root";
        return `${normalizeComparableUrl(opportunity.sourceUrl)}|${recommendationType}|${firstSegment}`;
    }
    catch (_c) {
        return `${normalizeComparableUrl(opportunity.sourceUrl)}|${recommendationType}|${(0, shared_1.normalizePhrase)(opportunity.targetUrl)}`;
    }
}
function qualityScore(opportunity, source, target, brandCandidates) {
    const base = opportunity.confidenceScore;
    const anchor = opportunity.suggestedAnchor;
    const nonBrandBonus = hasUsableAnchor(anchor) && !isBrandAnchor(anchor, brandCandidates) ? 10 : 0;
    const topicalAnchorBonus = hasUsableAnchor(anchor) ? Math.min(12, anchorAffinity(anchor, opportunity.targetUrl, opportunity.targetTitle) * 4) : 0;
    const sourceTargetThemeBonus = source && target ? Math.min(12, Math.round(topicOverlapScore(source, target) * 0.18)) : 0;
    const rewritePenalty = hasUsableAnchor(anchor) ? 0 : -8;
    const intent = anchorIntentScore(opportunity, brandCandidates);
    return (base +
        nonBrandBonus +
        topicalAnchorBonus +
        sourceTargetThemeBonus +
        rewritePenalty +
        intent);
}
function topicOverlapScore(source, target) {
    const sourceTokens = new Set([
        ...(0, shared_1.tokenize)(source.primaryTopic),
        ...source.keywords,
        ...source.topicPhrases.slice(0, 8).flatMap((phrase) => (0, shared_1.tokenize)(phrase.phrase)),
    ]);
    const targetTokens = new Set([
        ...(0, shared_1.tokenize)(target.primaryTopic),
        ...target.keywords,
        ...target.topicPhrases.slice(0, 8).flatMap((phrase) => (0, shared_1.tokenize)(phrase.phrase)),
    ]);
    if (sourceTokens.size === 0 || targetTokens.size === 0) {
        return 0;
    }
    const overlap = [...targetTokens].filter((token) => sourceTokens.has(token)).length;
    return Math.round((overlap / Math.max(1, Math.min(sourceTokens.size, targetTokens.size))) * 100);
}
function inferRecommendationType(source, target) {
    const sourcePath = (0, shared_1.normalizePhrase)(new URL(source.url).pathname);
    const targetPath = (0, shared_1.normalizePhrase)(new URL(target.url).pathname);
    if (targetPath.includes("service") || targetPath.includes("solution")) {
        return "related service";
    }
    if (targetPath.includes("contact") ||
        targetPath.includes("book") ||
        targetPath.includes("quote") ||
        targetPath.includes("pricing")) {
        return "next-step page";
    }
    if (sourcePath.includes("location") || targetPath.includes("location")) {
        return "location/service related page";
    }
    if (targetPath.includes("blog") || targetPath.includes("guide") || targetPath.includes("faq")) {
        return "supporting information";
    }
    return "nearby topic";
}
function buildRelatedCandidates(source, pages) {
    const isBroadlyEligible = (target) => {
        if (source.url === target.url) {
            return false;
        }
        if (!target.indexable) {
            return false;
        }
        const blockedTargetPathFragments = ["/404", "/not-found", "/error", "/page-not-found"];
        const targetPath = new URL(target.url).pathname.toLowerCase();
        return !blockedTargetPathFragments.some((fragment) => targetPath.includes(fragment));
    };
    const strictCandidates = pages.filter((target) => getPairSkipReason(source, target) === null);
    const candidatePool = strictCandidates.length > 0 ? strictCandidates : pages.filter(isBroadlyEligible);
    const ranked = candidatePool
        .map((target) => ({
        target,
        score: topicOverlapScore(source, target),
    }))
        .sort((a, b) => b.score - a.score);
    const aboveThreshold = ranked.filter((entry) => entry.score >= 12);
    const selected = (aboveThreshold.length > 0 ? aboveThreshold : ranked).slice(0, 3);
    return selected
        .map(({ target }) => {
        const rewriteStrength = rewriteStrengthForPair(source, target);
        if (!rewriteStrength) {
            return null;
        }
        const candidate = {
            id: buildOpportunityId(source.url, target.url, null),
            sourceUrl: source.url,
            sourceTitle: source.title,
            targetUrl: target.url,
            targetTitle: target.title,
            suggestedAnchor: null,
            rewriteSuggestion: buildRewriteSuggestion(source, target),
            matchedSnippet: "Add a contextual sentence in body text to introduce this linked topic naturally.",
            placementHint: "Content improvement opportunity. Suggested rewrite available.",
            reason: "A rewrite is suggested to add a natural contextual link between closely related topics.",
            expectedOutcome: buildExpectedOutcome(null, source, target),
            confidence: rewriteStrength.confidence,
            confidenceScore: rewriteStrength.confidenceScore,
            status: "open",
            category: "Internal linking",
            opportunityType: "related",
            recommendationType: inferRecommendationType(source, target),
        };
        return candidate;
    })
        .filter((candidate) => candidate !== null);
}
function buildDebugEntry(source, targetEvaluations, opportunitiesFound) {
    const extractedTopicTerms = Array.from(new Set([
        ...(0, shared_1.tokenize)(source.title),
        ...(0, shared_1.tokenize)(source.h1),
        ...(0, shared_1.tokenize)(source.primaryTopic),
        ...source.topicPhrases.slice(0, 8).flatMap((phrase) => (0, shared_1.tokenize)(phrase.phrase)),
    ])).slice(0, 20);
    return {
        sourceUrl: source.url,
        sourceTitle: source.title,
        sourcePrimaryTopic: source.primaryTopic,
        extractedTopicTerms,
        selectedContentSelector: source.contentDebug.selectedContentSelector,
        paragraphCount: source.contentDebug.paragraphCount,
        extractedChunkCount: source.contentDebug.extractedBlockCount,
        firstExtractedTextChunks: source.contentDebug.firstExtractedTextChunks,
        fallbackStrategyUsed: source.contentDebug.fallbackStrategyUsed,
        headingCounts: source.contentDebug.headingCounts,
        headingTexts: source.contentDebug.headingTexts,
        hasMultipleVisibleH1: source.contentDebug.hasMultipleVisibleH1,
        contextualBodyLinks: source.contentDebug.contextualBodyLinks,
        candidateTargetPagesConsidered: targetEvaluations.length,
        opportunitiesFound,
        targetEvaluations,
    };
}
function findLinkOpportunities(pages, maxOpportunities = 24, options = {}) {
    var _a, _b, _c, _d;
    const topicProfiles = (0, analyseSiteTopics_1.analyseSiteTopics)(pages);
    const brandCandidates = inferBrandCandidates(topicProfiles);
    const sourceUrlFilter = options.sourceUrl ? normalizeComparableUrl(options.sourceUrl) : null;
    const debug = [];
    const suggestions = [];
    const seen = new Set();
    let brandAnchorSuggestionsAccepted = 0;
    const diagnostics = {
        pagesInput: pages.length,
        pagesWithUsableContent: pages.filter((page) => page.indexable && page.bodyText.length >= 80 && page.contentSections.length > 0).length,
        internalLinksExtracted: pages.reduce((sum, page) => sum + page.existingInternalLinks.length, 0),
        candidateSourcePages: topicProfiles.length,
        candidateDestinationPages: topicProfiles.length,
        contextsEvaluated: 0,
        pairEvaluations: 0,
        rawBodyAnchorMatchesFound: 0,
        rawAcceptedCandidates: 0,
        droppedByFilter: {
            contentLength: 0,
            samePage: 0,
            alreadyLinked: 0,
            canonicalTarget: 0,
            samePrimaryTopic: 0,
            notIndexable: 0,
            anchorMatchOrSimilarity: 0,
            fallbackAnchor: 0,
            shortAnchor: 0,
            lowScore: 0,
        },
        duplicateCandidatesRemoved: 0,
        removedByPerSourceCap: 0,
        removedByGlobalCap: 0,
        relatedCandidatesGenerated: 0,
        relatedSelected: 0,
        finalOpportunities: 0,
    };
    for (const source of topicProfiles) {
        if (sourceUrlFilter && normalizeComparableUrl(source.url) !== sourceUrlFilter) {
            continue;
        }
        const targetEvaluations = [];
        let sourceOpportunities = 0;
        const blockedSourceAnchors = new Set([
            ...source.existingInternalLinkEntries.map((entry) => entry.normalizedAnchorText),
            ...source.contentDebug.blockedAnchorPhrases.map((phrase) => (0, urlCompare_1.normalizeAnchorTextForCompare)(phrase)),
        ].filter(Boolean));
        for (const target of topicProfiles) {
            diagnostics.pairEvaluations += 1;
            const skipReason = getPairSkipReason(source, target);
            const alreadyLinked = sourceAlreadyLinksToTarget(source, target.url);
            if (skipReason) {
                if (source.url === target.url) {
                    diagnostics.droppedByFilter.samePage += 1;
                }
                else if (alreadyLinked) {
                    diagnostics.droppedByFilter.alreadyLinked += 1;
                }
                else if (!source.indexable || !target.indexable) {
                    diagnostics.droppedByFilter.notIndexable += 1;
                }
                targetEvaluations.push({
                    targetUrl: target.url,
                    targetTitle: target.title,
                    candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
                    candidateAnchorPhrases: [],
                    existingContextualBodyLink: alreadyLinked,
                    matchedSnippets: [],
                    decision: "skipped",
                    reasons: [skipReason],
                });
                continue;
            }
            if (!hasStrongSourceTargetTopicFit(source, target)) {
                targetEvaluations.push({
                    targetUrl: target.url,
                    targetTitle: target.title,
                    candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
                    candidateAnchorPhrases: [],
                    existingContextualBodyLink: alreadyLinked,
                    matchedSnippets: [],
                    decision: "skipped",
                    reasons: [
                        "Skipped because target topic does not sufficiently align with the source page title/H1 theme.",
                    ],
                });
                diagnostics.droppedByFilter.anchorMatchOrSimilarity += 1;
                continue;
            }
            let matched = false;
            const rejectedReasons = [];
            const candidateAnchorPhrases = [];
            let winningCandidate = null;
            let bestNonBrandCandidate = null;
            for (const context of source.bodyContexts) {
                diagnostics.contextsEvaluated += 1;
                if (!["paragraph", "list_item"].includes(context.blockType)) {
                    diagnostics.droppedByFilter.anchorMatchOrSimilarity += 1;
                    continue;
                }
                if (context.text.length < 28) {
                    diagnostics.droppedByFilter.contentLength += 1;
                    continue;
                }
                const suggestion = (0, suggestAnchorText_1.suggestAnchorText)(context.text, target, {
                    blockedAnchors: blockedSourceAnchors,
                    brandCandidates,
                    sourcePageType: source.pageType,
                });
                if (!suggestion) {
                    diagnostics.droppedByFilter.anchorMatchOrSimilarity += 1;
                    continue;
                }
                if (suggestion.matchType === "fallback") {
                    rejectedReasons.push(`Rejected context under \"${context.sectionLabel}\" because only a fallback anchor was available, not a natural body mention.`);
                    diagnostics.droppedByFilter.fallbackAnchor += 1;
                    continue;
                }
                if (suggestion.anchor.length < 4) {
                    diagnostics.droppedByFilter.shortAnchor += 1;
                    continue;
                }
                if (sourceHasLinkedAnchorPhrase(source, suggestion.anchor)) {
                    diagnostics.droppedByFilter.alreadyLinked += 1;
                    continue;
                }
                diagnostics.rawBodyAnchorMatchesFound += 1;
                const scored = (0, scoreOpportunity_1.scoreOpportunity)({
                    source,
                    target,
                    context,
                    suggestion,
                });
                const sourceFit = scored.signals.sourceTopicAlignment;
                const targetFit = scored.signals.targetTopicAlignment;
                const combinedFit = sourceFit * 0.45 + targetFit * 0.55;
                const minScoreByMatchType = suggestion.matchType === "exact" ? 56 : 60;
                if (targetFit < 0.2 || combinedFit < 0.26) {
                    diagnostics.droppedByFilter.lowScore += 1;
                    candidateAnchorPhrases.push({
                        anchor: suggestion.anchor,
                        matchType: suggestion.matchType,
                        sectionLabel: context.sectionLabel,
                        sourceBlockType: context.blockType,
                        score: scored.score,
                        confidence: scored.confidence,
                        reason: `Rejected for weak topical fit (source ${Math.round(sourceFit * 100)}%, target ${Math.round(targetFit * 100)}%, combined ${Math.round(combinedFit * 100)}%).`,
                    });
                    continue;
                }
                if (scored.score < minScoreByMatchType) {
                    diagnostics.droppedByFilter.lowScore += 1;
                    candidateAnchorPhrases.push({
                        anchor: suggestion.anchor,
                        matchType: suggestion.matchType,
                        sectionLabel: context.sectionLabel,
                        sourceBlockType: context.blockType,
                        score: scored.score,
                        confidence: scored.confidence,
                        reason: `Rejected because score ${scored.score} is below minimum ${minScoreByMatchType}.`,
                    });
                    continue;
                }
                candidateAnchorPhrases.push({
                    anchor: suggestion.anchor,
                    matchType: suggestion.matchType,
                    sectionLabel: context.sectionLabel,
                    sourceBlockType: context.blockType,
                    score: scored.score,
                    confidence: scored.confidence,
                    reason: `Kept candidate with strong source and target alignment.`,
                });
                if (!winningCandidate || scored.score > winningCandidate.scored.score) {
                    winningCandidate = {
                        contextText: context.text,
                        sectionLabel: context.sectionLabel,
                        anchor: suggestion.anchor,
                        matchType: suggestion.matchType,
                        scored,
                    };
                }
                if (!isBrandAnchor(suggestion.anchor, brandCandidates)) {
                    if (!bestNonBrandCandidate || scored.score > bestNonBrandCandidate.scored.score) {
                        bestNonBrandCandidate = {
                            contextText: context.text,
                            sectionLabel: context.sectionLabel,
                            anchor: suggestion.anchor,
                            matchType: suggestion.matchType,
                            scored,
                        };
                    }
                }
            }
            if (winningCandidate) {
                const debugContextText = winningCandidate.contextText;
                const debugEnabled = shouldDebugAnchorExample(source.title, target.title, debugContextText);
                if (isBrandAnchor(winningCandidate.anchor, brandCandidates) && bestNonBrandCandidate) {
                    // Prefer topical non-brand anchor whenever one exists.
                    winningCandidate = bestNonBrandCandidate;
                }
                const snippet = (0, shared_1.buildSnippet)(winningCandidate.contextText, winningCandidate.anchor);
                const key = `${source.url}|${target.url}|${(0, shared_1.normalizePhrase)(winningCandidate.anchor)}`;
                const alreadyLinkedToTarget = sourceAlreadyLinksToTarget(source, target.url);
                const alreadyLinkedWithSameAnchor = sourceAlreadyLinksAnchorToTarget(source, target.url, winningCandidate.anchor);
                const isBrand = isBrandAnchor(winningCandidate.anchor, brandCandidates);
                const brandAnchorAllowed = isBrand &&
                    (isHomepageTarget(target.url) || isAboutTarget(target.url)) &&
                    winningCandidate.scored.confidence === "High" &&
                    !alreadyLinkedToTarget &&
                    brandAnchorSuggestionsAccepted === 0 &&
                    !bestNonBrandCandidate;
                if (debugEnabled) {
                    const rankedCandidates = [...candidateAnchorPhrases].sort((a, b) => b.score - a.score);
                    console.debug("[internal-linking][anchor-debug] context_sentence=", debugContextText);
                    for (const candidate of rankedCandidates) {
                        console.debug("[internal-linking][anchor-debug] candidate=", candidate.anchor, "score=", candidate.score, "reason=", candidate.reason);
                    }
                }
                if (seen.has(key)) {
                    if (debugEnabled) {
                        console.debug("[internal-linking][anchor-debug] selected_anchor=", winningCandidate.anchor, "filtered_reason=duplicate source/target/anchor");
                    }
                    diagnostics.duplicateCandidatesRemoved += 1;
                    targetEvaluations.push({
                        targetUrl: target.url,
                        targetTitle: target.title,
                        candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
                        candidateAnchorPhrases: candidateAnchorPhrases
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 12),
                        existingContextualBodyLink: alreadyLinkedToTarget,
                        matchedSnippets: [snippet],
                        decision: "rejected",
                        reasons: ["Best contextual candidate duplicated an existing source/target/anchor match."],
                    });
                    continue;
                }
                if (alreadyLinkedToTarget || alreadyLinkedWithSameAnchor) {
                    if (debugEnabled) {
                        console.debug("[internal-linking][anchor-debug] selected_anchor=", winningCandidate.anchor, "filtered_reason=already linked to target or anchor/target already linked");
                    }
                    diagnostics.droppedByFilter.alreadyLinked += 1;
                    targetEvaluations.push({
                        targetUrl: target.url,
                        targetTitle: target.title,
                        candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
                        candidateAnchorPhrases: candidateAnchorPhrases
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 12),
                        existingContextualBodyLink: alreadyLinkedToTarget,
                        matchedSnippets: [snippet],
                        decision: "skipped",
                        reasons: [
                            alreadyLinkedWithSameAnchor
                                ? "Skipped: source already links this anchor phrase to the target."
                                : "Skipped: source already links to target.",
                        ],
                    });
                    continue;
                }
                if (isBrand && !brandAnchorAllowed) {
                    if (debugEnabled) {
                        console.debug("[internal-linking][anchor-debug] selected_anchor=", winningCandidate.anchor, "filtered_reason=brand anchor policy");
                    }
                    diagnostics.droppedByFilter.anchorMatchOrSimilarity += 1;
                    targetEvaluations.push({
                        targetUrl: target.url,
                        targetTitle: target.title,
                        candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
                        candidateAnchorPhrases: candidateAnchorPhrases
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 12),
                        existingContextualBodyLink: alreadyLinkedToTarget,
                        matchedSnippets: [snippet],
                        decision: "rejected",
                        reasons: [
                            "Rejected brand anchor because it did not pass homepage/about/high-confidence non-duplicate policy.",
                        ],
                    });
                    continue;
                }
                seen.add(key);
                const confidence = recalibrateAnchorConfidence(winningCandidate.scored, winningCandidate.anchor, isBrand, target.url);
                suggestions.push({
                    id: buildOpportunityId(source.url, target.url, winningCandidate.anchor),
                    sourceUrl: source.url,
                    sourceTitle: source.title,
                    targetUrl: target.url,
                    targetTitle: target.title,
                    suggestedAnchor: winningCandidate.anchor,
                    rewriteSuggestion: null,
                    matchedSnippet: snippet,
                    placementHint: buildPlacementHint(winningCandidate.sectionLabel, winningCandidate.anchor),
                    reason: buildReason(source.title, target.title, winningCandidate.anchor, winningCandidate.scored),
                    expectedOutcome: buildExpectedOutcome(winningCandidate.anchor, source, target),
                    confidence: confidence.confidence,
                    confidenceScore: confidence.confidenceScore,
                    status: "open",
                    category: "Internal linking",
                    opportunityType: "contextual",
                });
                if (debugEnabled) {
                    console.debug("[internal-linking][anchor-debug] selected_anchor=", winningCandidate.anchor, "result=accepted");
                }
                if (isBrand) {
                    brandAnchorSuggestionsAccepted += 1;
                }
                sourceOpportunities += 1;
                diagnostics.rawAcceptedCandidates += 1;
                targetEvaluations.push({
                    targetUrl: target.url,
                    targetTitle: target.title,
                    candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
                    candidateAnchorPhrases: candidateAnchorPhrases
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 12),
                    existingContextualBodyLink: alreadyLinkedToTarget,
                    matchedSnippets: [snippet],
                    decision: "accepted",
                    reasons: [
                        `Accepted best candidate under \"${winningCandidate.sectionLabel}\" with ${winningCandidate.scored.confidence} confidence and score ${winningCandidate.scored.score}.`,
                    ],
                });
                matched = true;
            }
            if (!matched) {
                const rewriteSuggestion = buildRewriteSuggestion(source, target);
                const rewriteStrength = rewriteStrengthForPair(source, target);
                const rewriteKey = `${source.url}|${target.url}|rewrite`;
                if (rewriteStrength &&
                    !seen.has(rewriteKey) &&
                    !sourceAlreadyLinksToTarget(source, target.url)) {
                    seen.add(rewriteKey);
                    suggestions.push({
                        id: buildOpportunityId(source.url, target.url, null),
                        sourceUrl: source.url,
                        sourceTitle: source.title,
                        targetUrl: target.url,
                        targetTitle: target.title,
                        suggestedAnchor: null,
                        rewriteSuggestion,
                        matchedSnippet: (_a = source.contentDebug.firstExtractedTextChunks[0]) !== null && _a !== void 0 ? _a : "Add a contextual sentence in body copy that introduces the target topic naturally.",
                        placementHint: "Content improvement opportunity. Suggested rewrite available.",
                        reason: buildReason(source.title, target.title, null, {
                            score: rewriteStrength.confidenceScore,
                            confidence: rewriteStrength.confidence,
                            signals: {
                                sourceTopicAlignment: 0.62,
                                targetTopicAlignment: 0.62,
                                sourceTargetAlignment: 0.64,
                                sectionRelevance: 0.7,
                                topOfPageWeight: 0.7,
                                anchorNaturalness: 0,
                            },
                        }),
                        expectedOutcome: buildExpectedOutcome(null, source, target),
                        confidence: "Low",
                        confidenceScore: Math.min(56, rewriteStrength.confidenceScore),
                        status: "open",
                        category: "Internal linking",
                        opportunityType: "contextual",
                    });
                }
                targetEvaluations.push({
                    targetUrl: target.url,
                    targetTitle: target.title,
                    candidatePhrases: target.topicPhrases.map((phrase) => phrase.phrase),
                    candidateAnchorPhrases: candidateAnchorPhrases
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 12),
                    existingContextualBodyLink: sourceAlreadyLinksToTarget(source, target.url),
                    matchedSnippets: [],
                    decision: "rejected",
                    reasons: rejectedReasons.length > 0
                        ? rejectedReasons
                        : ["No strong contextual phrase match was found in source body copy."],
                });
            }
        }
        if (sourceOpportunities === 0) {
            const relatedCandidates = buildRelatedCandidates(source, topicProfiles);
            diagnostics.relatedCandidatesGenerated += relatedCandidates.length;
            for (const candidate of relatedCandidates) {
                const key = `${candidate.sourceUrl}|${candidate.targetUrl}|related`;
                if (seen.has(key)) {
                    diagnostics.duplicateCandidatesRemoved += 1;
                    continue;
                }
                seen.add(key);
                suggestions.push(candidate);
                diagnostics.relatedSelected += 1;
            }
        }
        debug.push(buildDebugEntry(source, targetEvaluations, sourceOpportunities));
    }
    const bestBySourceTarget = new Map();
    for (const suggestion of suggestions) {
        const key = `${suggestion.sourceUrl}|${suggestion.targetUrl}`;
        const existing = bestBySourceTarget.get(key);
        if (!existing || suggestion.confidenceScore > existing.confidenceScore) {
            bestBySourceTarget.set(key, suggestion);
        }
    }
    const bestBySourceAnchor = new Map();
    for (const suggestion of bestBySourceTarget.values()) {
        const anchorKey = `${suggestion.sourceUrl}|${hasUsableAnchor(suggestion.suggestedAnchor)
            ? (0, shared_1.normalizePhrase)(suggestion.suggestedAnchor)
            : (0, shared_1.normalizePhrase)((_b = suggestion.rewriteSuggestion) !== null && _b !== void 0 ? _b : `rewrite-${suggestion.targetUrl}`)}`;
        const existing = bestBySourceAnchor.get(anchorKey);
        if (!existing || isBetterAnchorCandidate(suggestion, existing)) {
            bestBySourceAnchor.set(anchorKey, suggestion);
        }
    }
    const sourceProfileByUrl = new Map(topicProfiles.map((profile) => [normalizeComparableUrl(profile.url), profile]));
    const targetProfileByUrl = new Map(topicProfiles.map((profile) => [normalizeComparableUrl(profile.url), profile]));
    const confidenceRank = {
        High: 3,
        Medium: 2,
        Low: 1,
    };
    const sorted = [...bestBySourceAnchor.values()].sort((a, b) => {
        const sourceA = sourceProfileByUrl.get(normalizeComparableUrl(a.sourceUrl));
        const targetA = targetProfileByUrl.get(normalizeComparableUrl(a.targetUrl));
        const sourceB = sourceProfileByUrl.get(normalizeComparableUrl(b.sourceUrl));
        const targetB = targetProfileByUrl.get(normalizeComparableUrl(b.targetUrl));
        const qualityA = qualityScore(a, sourceA, targetA, brandCandidates);
        const qualityB = qualityScore(b, sourceB, targetB, brandCandidates);
        if (qualityA !== qualityB) {
            return qualityB - qualityA;
        }
        if (confidenceRank[a.confidence] !== confidenceRank[b.confidence]) {
            return confidenceRank[b.confidence] - confidenceRank[a.confidence];
        }
        return b.confidenceScore - a.confidenceScore;
    });
    const filteredByExistingLinks = sorted.filter((suggestion) => {
        var _a;
        const sourceProfile = sourceProfileByUrl.get(normalizeComparableUrl(suggestion.sourceUrl));
        if (!sourceProfile) {
            return true;
        }
        const alreadyLinkedToTarget = sourceAlreadyLinksToTarget(sourceProfile, suggestion.targetUrl);
        const alreadyLinkedWithSameAnchor = hasUsableAnchor(suggestion.suggestedAnchor) &&
            sourceAlreadyLinksAnchorToTarget(sourceProfile, suggestion.targetUrl, suggestion.suggestedAnchor);
        const anchorAlreadyLinkedAnywhere = hasUsableAnchor(suggestion.suggestedAnchor) &&
            sourceHasLinkedAnchorPhrase(sourceProfile, suggestion.suggestedAnchor);
        const hasInvalidAnchor = Boolean(suggestion.suggestedAnchor) &&
            !(0, suggestAnchorText_1.isHumanQualityAnchor)((_a = suggestion.suggestedAnchor) !== null && _a !== void 0 ? _a : "");
        if (alreadyLinkedToTarget ||
            alreadyLinkedWithSameAnchor ||
            anchorAlreadyLinkedAnywhere ||
            hasInvalidAnchor) {
            if (hasInvalidAnchor) {
                console.debug("[internal-linking][anchor-rejected]", {
                    original: suggestion.suggestedAnchor,
                    reasons: ["failed-final-safety-pass"],
                });
            }
            diagnostics.droppedByFilter.alreadyLinked += 1;
            return false;
        }
        // Rewrite-only opportunities are always low confidence.
        if (!hasUsableAnchor(suggestion.suggestedAnchor)) {
            suggestion.confidence = "Low";
            suggestion.confidenceScore = Math.min(56, suggestion.confidenceScore);
        }
        return hasUsableAnchor(suggestion.suggestedAnchor) || Boolean(suggestion.rewriteSuggestion);
    });
    const actionable = [];
    const rewrites = [];
    for (const opportunity of filteredByExistingLinks) {
        if (hasUsableAnchor(opportunity.suggestedAnchor)) {
            actionable.push(opportunity);
            continue;
        }
        rewrites.push(opportunity);
    }
    if (actionable.length < MIN_ACTIONABLE_OPPORTUNITIES && topicProfiles.length > 1) {
        const localSourceProfileByUrl = new Map(topicProfiles.map((profile) => [normalizeComparableUrl(profile.url), profile]));
        const localTargetProfileByUrl = new Map(topicProfiles.map((profile) => [normalizeComparableUrl(profile.url), profile]));
        const actionableKeys = new Set(actionable.map((opportunity) => {
            var _a;
            return `${normalizeComparableUrl(opportunity.sourceUrl)}|${normalizeComparableUrl(opportunity.targetUrl)}|${(0, shared_1.normalizePhrase)((_a = opportunity.suggestedAnchor) !== null && _a !== void 0 ? _a : "")}`;
        }));
        const fallbackAnchorOpportunities = [];
        for (const source of topicProfiles) {
            for (const target of topicProfiles) {
                if (source.url === target.url || sourceAlreadyLinksToTarget(source, target.url)) {
                    continue;
                }
                if (!hasStrongSourceTargetTopicFit(source, target)) {
                    continue;
                }
                const anchors = fallbackAnchorVariants(source, target);
                for (const anchor of anchors) {
                    if (!(0, suggestAnchorText_1.isValidAnchor)(anchor)) {
                        console.debug("[internal-linking][anchor-rejected]", {
                            original: anchor,
                            reasons: ["fallback-anchor-failed-validation"],
                        });
                        continue;
                    }
                    if (sourceHasLinkedAnchorPhrase(source, anchor)) {
                        continue;
                    }
                    if (isBrandAnchor(anchor, brandCandidates) && !(isHomepageTarget(target.url) || isAboutTarget(target.url))) {
                        continue;
                    }
                    const key = `${normalizeComparableUrl(source.url)}|${normalizeComparableUrl(target.url)}|${(0, shared_1.normalizePhrase)(anchor)}`;
                    if (actionableKeys.has(key)) {
                        continue;
                    }
                    fallbackAnchorOpportunities.push({
                        id: buildOpportunityId(source.url, target.url, anchor),
                        sourceUrl: source.url,
                        sourceTitle: source.title,
                        targetUrl: target.url,
                        targetTitle: target.title,
                        suggestedAnchor: anchor,
                        rewriteSuggestion: null,
                        matchedSnippet: (_c = source.contentDebug.firstExtractedTextChunks[0]) !== null && _c !== void 0 ? _c : `Add a natural sentence mentioning "${anchor}" in body copy.`,
                        placementHint: `Body content: add a natural sentence using "${anchor}".`,
                        reason: `Generated from source and target topic overlap to provide a clear, natural anchor phrase.`,
                        expectedOutcome: buildExpectedOutcome(anchor, source, target),
                        confidence: "Low",
                        confidenceScore: 52,
                        status: "open",
                        category: "Internal linking",
                        opportunityType: "contextual",
                    });
                    actionableKeys.add(key);
                }
            }
        }
        fallbackAnchorOpportunities.sort((a, b) => {
            const sourceA = localSourceProfileByUrl.get(normalizeComparableUrl(a.sourceUrl));
            const targetA = localTargetProfileByUrl.get(normalizeComparableUrl(a.targetUrl));
            const sourceB = localSourceProfileByUrl.get(normalizeComparableUrl(b.sourceUrl));
            const targetB = localTargetProfileByUrl.get(normalizeComparableUrl(b.targetUrl));
            const scoreA = qualityScore(a, sourceA, targetA, brandCandidates);
            const scoreB = qualityScore(b, sourceB, targetB, brandCandidates);
            return scoreB - scoreA;
        });
        actionable.push(...fallbackAnchorOpportunities.slice(0, Math.max(0, MIN_ACTIONABLE_OPPORTUNITIES - actionable.length)));
    }
    const dedupedRewriteMap = new Map();
    for (const rewrite of rewrites) {
        const key = rewriteIntentKey(rewrite);
        const existing = dedupedRewriteMap.get(key);
        if (!existing || rewrite.confidenceScore > existing.confidenceScore) {
            dedupedRewriteMap.set(key, rewrite);
        }
    }
    const maxRewriteCount = Math.min(2, Math.max(1, Math.floor(maxOpportunities / 12)));
    const dedupedRewrites = [...dedupedRewriteMap.values()]
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, maxRewriteCount);
    let finalOpportunities = [...actionable, ...dedupedRewrites]
        .sort((a, b) => {
        if (confidenceRank[a.confidence] !== confidenceRank[b.confidence]) {
            return confidenceRank[b.confidence] - confidenceRank[a.confidence];
        }
        const aAnchorBonus = hasUsableAnchor(a.suggestedAnchor) ? 1 : 0;
        const bAnchorBonus = hasUsableAnchor(b.suggestedAnchor) ? 1 : 0;
        if (aAnchorBonus !== bAnchorBonus) {
            return bAnchorBonus - aAnchorBonus;
        }
        return b.confidenceScore - a.confidenceScore;
    })
        .slice(0, maxOpportunities);
    if (finalOpportunities.length < MIN_ACTIONABLE_OPPORTUNITIES && topicProfiles.length > 1) {
        const existingKeys = new Set(finalOpportunities.map((opportunity) => {
            var _a;
            return `${normalizeComparableUrl(opportunity.sourceUrl)}|${normalizeComparableUrl(opportunity.targetUrl)}|${hasUsableAnchor(opportunity.suggestedAnchor)
                ? (0, shared_1.normalizePhrase)(opportunity.suggestedAnchor)
                : (0, shared_1.normalizePhrase)((_a = opportunity.rewriteSuggestion) !== null && _a !== void 0 ? _a : "rewrite")}`;
        }));
        const fallbackPool = [];
        for (const source of topicProfiles) {
            for (const target of topicProfiles) {
                if (source.url === target.url ||
                    sourceAlreadyLinksToTarget(source, target.url) ||
                    !hasStrongSourceTargetTopicFit(source, target)) {
                    continue;
                }
                const rewriteStrength = rewriteStrengthForPair(source, target);
                if (!rewriteStrength) {
                    continue;
                }
                const rewriteSuggestion = buildRewriteSuggestion(source, target);
                const key = `${normalizeComparableUrl(source.url)}|${normalizeComparableUrl(target.url)}|${(0, shared_1.normalizePhrase)(rewriteSuggestion)}`;
                if (existingKeys.has(key)) {
                    continue;
                }
                fallbackPool.push({
                    id: buildOpportunityId(source.url, target.url, null),
                    sourceUrl: source.url,
                    sourceTitle: source.title,
                    targetUrl: target.url,
                    targetTitle: target.title,
                    suggestedAnchor: null,
                    rewriteSuggestion,
                    matchedSnippet: (_d = source.contentDebug.firstExtractedTextChunks[0]) !== null && _d !== void 0 ? _d : "Add a naturally worded sentence in body content that introduces the target topic.",
                    placementHint: "Content improvement opportunity. Suggested rewrite available.",
                    reason: buildReason(source.title, target.title, null, {
                        score: rewriteStrength.confidenceScore,
                        confidence: rewriteStrength.confidence,
                        signals: {
                            sourceTopicAlignment: 0.62,
                            targetTopicAlignment: 0.62,
                            sourceTargetAlignment: 0.64,
                            sectionRelevance: 0.7,
                            topOfPageWeight: 0.7,
                            anchorNaturalness: 0,
                        },
                    }),
                    expectedOutcome: buildExpectedOutcome(null, source, target),
                    confidence: "Low",
                    confidenceScore: Math.min(56, rewriteStrength.confidenceScore),
                    status: "open",
                    category: "Internal linking",
                    opportunityType: "related",
                });
                existingKeys.add(key);
            }
        }
        fallbackPool.sort((a, b) => {
            const sourceA = sourceProfileByUrl.get(normalizeComparableUrl(a.sourceUrl));
            const targetA = targetProfileByUrl.get(normalizeComparableUrl(a.targetUrl));
            const sourceB = sourceProfileByUrl.get(normalizeComparableUrl(b.sourceUrl));
            const targetB = targetProfileByUrl.get(normalizeComparableUrl(b.targetUrl));
            const scoreA = qualityScore(a, sourceA, targetA, brandCandidates);
            const scoreB = qualityScore(b, sourceB, targetB, brandCandidates);
            return scoreB - scoreA;
        });
        finalOpportunities = [...finalOpportunities, ...fallbackPool]
            .slice(0, Math.max(maxOpportunities, MIN_ACTIONABLE_OPPORTUNITIES))
            .slice(0, Math.max(finalOpportunities.length, MIN_ACTIONABLE_OPPORTUNITIES));
    }
    diagnostics.duplicateCandidatesRemoved += Math.max(0, suggestions.length - bestBySourceTarget.size + (bestBySourceTarget.size - sorted.length));
    diagnostics.removedByGlobalCap = Math.max(0, filteredByExistingLinks.length - finalOpportunities.length);
    diagnostics.finalOpportunities = finalOpportunities.length;
    console.debug("[internal-linking][pipeline]", diagnostics);
    return {
        pages: topicProfiles,
        opportunities: finalOpportunities,
        scannedPageCount: pages.length,
        debug,
        diagnostics,
    };
}
