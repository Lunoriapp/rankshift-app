"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreAudit = scoreAudit;
const TITLE_MIN = 10;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;
const RAW_TOTAL_MAX = 140;
const DISPLAY_TOTAL_MAX = 100;
function getWordCount(value) {
    return value.split(/\s+/).filter(Boolean).length;
}
function getTitleScore(length) {
    if (length >= 20 && length <= 58) {
        return 10;
    }
    if (length >= TITLE_MIN && length <= TITLE_MAX) {
        return 7;
    }
    if (length >= 6 && length <= 70) {
        return 3;
    }
    return 0;
}
function getDescriptionScore(length) {
    if (length >= 90 && length <= 155) {
        return 10;
    }
    if (length >= DESCRIPTION_MIN && length <= DESCRIPTION_MAX) {
        return 7;
    }
    if (length >= 35 && length <= 180) {
        return 3;
    }
    return 0;
}
function buildPillar(checks, maxScore) {
    return {
        score: checks.reduce((sum, check) => sum + check.score, 0),
        maxScore,
        checks,
    };
}
function getImageScore(images) {
    if (images.length === 0) {
        return 20;
    }
    const withAltCount = images.filter((image) => image.alt.trim().length > 0).length;
    const ratio = withAltCount / images.length;
    if (ratio === 1) {
        return 20;
    }
    if (ratio >= 0.75) {
        return 15;
    }
    if (ratio >= 0.5) {
        return 10;
    }
    if (ratio > 0) {
        return 5;
    }
    return 0;
}
function getPerformanceScore(loadTimeMs) {
    if (loadTimeMs < 1500) {
        return 20;
    }
    if (loadTimeMs < 2500) {
        return 16;
    }
    if (loadTimeMs < 4000) {
        return 10;
    }
    if (loadTimeMs < 6000) {
        return 5;
    }
    return 0;
}
function getContentDepthHeadingScore(headingCount) {
    if (headingCount >= 5) {
        return 10;
    }
    if (headingCount >= 3) {
        return 6;
    }
    return 0;
}
function getInternalLinkCoverageScore(internalLinkCount) {
    if (internalLinkCount >= 10) {
        return 10;
    }
    if (internalLinkCount >= 6) {
        return 8;
    }
    if (internalLinkCount >= 3) {
        return 4;
    }
    return 0;
}
function getInternalLinkOpportunityScore(data) {
    var _a, _b;
    const opportunities = (_b = (_a = data.internalLinking) === null || _a === void 0 ? void 0 : _a.opportunities) !== null && _b !== void 0 ? _b : [];
    const highConfidenceCount = opportunities.filter((opportunity) => opportunity.confidence === "High").length;
    const mediumConfidenceCount = opportunities.filter((opportunity) => opportunity.confidence === "Medium").length;
    if (highConfidenceCount === 0 && mediumConfidenceCount <= 1) {
        return 10;
    }
    if (highConfidenceCount <= 1 && mediumConfidenceCount <= 3) {
        return 5;
    }
    return 0;
}
function splitIntoSentences(value) {
    return value
        .split(/(?<=[.!?])\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
}
function wordCount(value) {
    return value.split(/\s+/).filter(Boolean).length;
}
function hasSummaryAnswerNearTop(data) {
    var _a;
    const topBlocks = data.contentSections
        .filter((section) => section.type === "paragraph")
        .slice(0, 2)
        .map((section) => section.text.trim())
        .filter(Boolean);
    const candidate = (_a = topBlocks[0]) !== null && _a !== void 0 ? _a : splitIntoSentences(data.bodyText).slice(0, 2).join(" ");
    const count = wordCount(candidate);
    if (count < 50 || count > 120) {
        return false;
    }
    const topicTokens = new Set(`${data.h1} ${data.title}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4));
    const candidateTokens = candidate
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4);
    const overlap = candidateTokens.filter((token) => topicTokens.has(token)).length;
    return overlap >= 2;
}
function hasFaqQaSignals(data) {
    const headingQuestionCount = data.headings.filter((heading) => heading.text.includes("?")).length;
    const questionSentenceCount = splitIntoSentences(data.bodyText).filter((sentence) => /^[A-Z].*\?$/.test(sentence)).length;
    const faqKeywordPresent = /\bfaq\b|frequently asked questions/i.test(data.bodyText);
    return headingQuestionCount >= 1 || questionSentenceCount >= 2 || faqKeywordPresent;
}
function hasAuthorCredibilitySignals(data) {
    return /\bwritten by\b|\breviewed by\b|\bauthor\b|\bexpert\b|\bqualified\b|\byears of experience\b|\bsolicitor\b/i.test(data.bodyText);
}
function hasEntityClaritySignals(data) {
    const hasCorePageIdentity = data.title.trim().length > 0 && data.h1.trim().length > 0;
    const hasWhoWhatWhereSignals = /\bbased in\b|\blocated in\b|\bserving\b|\bfor\b|\bour team\b|\bwe help\b/i.test(data.bodyText);
    return hasCorePageIdentity && hasWhoWhatWhereSignals;
}
function hasStructuredHeadingSections(data) {
    return data.headings.length >= 3 && data.contentSections.length >= 4;
}
function hasSchemaVisibilitySignals(data) {
    var _a, _b;
    return data.hasJsonLd || ((_b = (_a = data.schemaTypes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
}
function normalizeToDisplayScore(value, rawMax = RAW_TOTAL_MAX) {
    return Math.max(0, Math.min(DISPLAY_TOTAL_MAX, Math.round((value / rawMax) * DISPLAY_TOTAL_MAX)));
}
function getQualityPenalty(data) {
    let penalty = 0;
    const wordCount = getWordCount(data.bodyText);
    const h2Count = data.h2s.length;
    if (!data.canonical) {
        penalty += 4;
    }
    if (wordCount < 450) {
        penalty += 12;
    }
    else if (wordCount < 700) {
        penalty += 8;
    }
    else if (wordCount < 900) {
        penalty += 5;
    }
    if (h2Count === 0) {
        penalty += 6;
    }
    else if (h2Count === 1) {
        penalty += 3;
    }
    return penalty;
}
function getOpportunityLabel(score) {
    if (score >= 80) {
        return "High Potential";
    }
    if (score >= 65) {
        return "Strong";
    }
    if (score >= 45) {
        return "Emerging";
    }
    return "At Risk";
}
function getOpportunityRationale(label, uplift) {
    if (label === "High Potential") {
        return uplift > 0
            ? "This page already has a solid SEO foundation and could improve further with a few targeted fixes."
            : "This page is already well aligned with strong technical and on-page SEO signals.";
    }
    if (label === "Strong") {
        return "This page has strong ranking signals, with clear upside still available from the missing improvements.";
    }
    if (label === "Emerging") {
        return "This page has useful search potential, but incomplete optimisation is still reducing ranking strength.";
    }
    return "This page is missing several core signals, which is limiting visibility and reducing ranking potential.";
}
function buildOpportunityAssessment(data, total, metaScore, headingScore, imageScore, performanceScore, internalLinkingScore) {
    const normalizedTotal = normalizeToDisplayScore(total);
    const canonicalScore = data.canonical ? 5 : 0;
    const opportunityScore = Math.min(100, metaScore +
        headingScore +
        imageScore / 2 +
        Math.round((performanceScore / 20) * 15) +
        (data.hasJsonLd ? 15 : 0) +
        Math.round((internalLinkingScore / 20) * 15) +
        canonicalScore);
    const remainingGap = Math.max(0, 100 - normalizedTotal);
    const uplift = Math.min(18, Math.max(0, Math.ceil(remainingGap * 0.45)));
    const projectedScore = Math.min(100, normalizedTotal + uplift);
    const label = getOpportunityLabel(opportunityScore);
    return {
        score: opportunityScore,
        projectedScore,
        uplift,
        label,
        rationale: getOpportunityRationale(label, uplift),
    };
}
function scoreAudit(data) {
    const titleLength = data.title.trim().length;
    const descriptionLength = data.description.trim().length;
    const titleScore = getTitleScore(titleLength);
    const descriptionScore = getDescriptionScore(descriptionLength);
    const h1Count = data.headings.filter((heading) => heading.level === 1).length;
    const totalHeadings = data.headings.length;
    const contentDepthHeadingScore = getContentDepthHeadingScore(totalHeadings);
    const imageScore = getImageScore(data.images);
    const performanceScore = getPerformanceScore(data.loadTimeMs);
    const internalLinkCoverageScore = getInternalLinkCoverageScore(data.internalLinkCount);
    const internalLinkOpportunityScore = getInternalLinkOpportunityScore(data);
    const summaryNearTop = hasSummaryAnswerNearTop(data);
    const structuredSections = hasStructuredHeadingSections(data);
    const faqQaSignals = hasFaqQaSignals(data);
    const authorSignals = hasAuthorCredibilitySignals(data);
    const entitySignals = hasEntityClaritySignals(data);
    const schemaSignals = hasSchemaVisibilitySignals(data);
    const internalTopicSupport = data.internalLinkCount >= 3;
    const meta = buildPillar([
        {
            label: "Title length valid",
            passed: titleScore >= 7,
            score: titleScore,
            maxScore: 10,
        },
        {
            label: "Description length valid",
            passed: descriptionScore >= 7,
            score: descriptionScore,
            maxScore: 10,
        },
    ], 20);
    const headings = buildPillar([
        {
            label: "Exactly 1 H1",
            passed: h1Count === 1,
            score: h1Count === 1 ? 10 : 0,
            maxScore: 10,
        },
        {
            label: "At least 3 headings total",
            passed: totalHeadings >= 3,
            score: contentDepthHeadingScore,
            maxScore: 10,
        },
    ], 20);
    const images = buildPillar([
        {
            label: "Images with alt text coverage",
            passed: imageScore === 20,
            score: imageScore,
            maxScore: 20,
        },
    ], 20);
    const performance = buildPillar([
        {
            label: "Page load time",
            passed: performanceScore === 20,
            score: performanceScore,
            maxScore: 20,
        },
    ], 20);
    const schema = buildPillar([
        {
            label: "JSON-LD schema present",
            passed: data.hasJsonLd,
            score: data.hasJsonLd ? 20 : 0,
            maxScore: 20,
        },
    ], 20);
    const internalLinking = buildPillar([
        {
            label: "Contextual internal link coverage supports this page",
            passed: internalLinkCoverageScore >= 7,
            score: internalLinkCoverageScore,
            maxScore: 10,
        },
        {
            label: "No high-confidence internal linking gaps at current crawl depth",
            passed: internalLinkOpportunityScore === 10,
            score: internalLinkOpportunityScore,
            maxScore: 10,
        },
    ], 20);
    const aiVisibility = buildPillar([
        {
            label: "Clear summary answer near top (50-120 words)",
            passed: summaryNearTop,
            score: summaryNearTop ? 4 : 0,
            maxScore: 4,
        },
        {
            label: "Structured headings and sections",
            passed: structuredSections,
            score: structuredSections ? 3 : 0,
            maxScore: 3,
        },
        {
            label: "FAQ-style questions and answers",
            passed: faqQaSignals,
            score: faqQaSignals ? 3 : 0,
            maxScore: 3,
        },
        {
            label: "Author and credibility signals",
            passed: authorSignals,
            score: authorSignals ? 3 : 0,
            maxScore: 3,
        },
        {
            label: "Entity clarity (who, what, where)",
            passed: entitySignals,
            score: entitySignals ? 3 : 0,
            maxScore: 3,
        },
        {
            label: "Internal links support topic relationships",
            passed: internalTopicSupport,
            score: internalTopicSupport ? 2 : 0,
            maxScore: 2,
        },
        {
            label: "Basic schema signals (FAQ, Article, Organization)",
            passed: schemaSignals,
            score: schemaSignals ? 2 : 0,
            maxScore: 2,
        },
    ], 20);
    const total = meta.score +
        headings.score +
        images.score +
        performance.score +
        schema.score +
        internalLinking.score +
        aiVisibility.score;
    const qualityPenalty = getQualityPenalty(data);
    const adjustedTotal = Math.max(0, total - qualityPenalty);
    return {
        total: normalizeToDisplayScore(adjustedTotal),
        maxScore: 100,
        opportunity: buildOpportunityAssessment(data, adjustedTotal, meta.score, headings.score, images.score, performance.score, internalLinking.score),
        pillars: {
            meta,
            headings,
            images,
            performance,
            schema,
            internalLinking,
            aiVisibility,
        },
    };
}
