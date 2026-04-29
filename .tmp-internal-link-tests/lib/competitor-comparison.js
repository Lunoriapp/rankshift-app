"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitorComparisonData = void 0;
exports.buildAuditCompetitorComparisonData = buildAuditCompetitorComparisonData;
exports.buildCompetitorComparisonDataFromAudit = buildCompetitorComparisonDataFromAudit;
exports.buildComparisonRows = buildComparisonRows;
exports.buildCompetitorInsights = buildCompetitorInsights;
exports.competitorComparisonData = {
    user: {
        name: "Your Page",
        score: 50,
        titleLength: 82,
        h1: false,
        wordCount: 620,
        internalLinks: 3,
        schema: false,
    },
    competitors: [
        {
            name: "Competitor A",
            score: 72,
            titleLength: 58,
            h1: true,
            wordCount: 1400,
            internalLinks: 12,
            schema: true,
        },
        {
            name: "Competitor B",
            score: 68,
            titleLength: 61,
            h1: true,
            wordCount: 1200,
            internalLinks: 9,
            schema: true,
        },
    ],
};
function getWordCount(bodyText) {
    return bodyText.split(/\s+/).filter(Boolean).length;
}
function createMockCompetitor(input) {
    return input;
}
function buildFallbackCompetitorsFromUserMetrics(input) {
    const source = new URL(input.url);
    const path = source.pathname === "/" ? "/service-page" : source.pathname;
    return [
        createMockCompetitor({
            name: "Competitor A",
            url: `https://competitor-a.example${path}`,
            score: Math.min(Math.max(input.score, 42) + 18, 92),
            titleLength: 58,
            h1: true,
            wordCount: Math.max(input.wordCount + 650, 1200),
            internalLinks: Math.max(input.internalLinks + 6, 8),
            schema: true,
        }),
        createMockCompetitor({
            name: "Competitor B",
            url: `https://competitor-b.example${path}`,
            score: Math.min(Math.max(input.score, 42) + 13, 88),
            titleLength: 61,
            h1: true,
            wordCount: Math.max(input.wordCount + 450, 1050),
            internalLinks: Math.max(input.internalLinks + 4, 7),
            schema: true,
        }),
    ];
}
function buildAuditCompetitorComparisonData(crawl, score) {
    const userWordCount = getWordCount(crawl.bodyText);
    return {
        user: {
            name: "Your Page",
            url: crawl.url,
            score: score.total,
            titleLength: crawl.title.trim().length,
            h1: crawl.h1.trim().length > 0,
            wordCount: getWordCount(crawl.bodyText),
            internalLinks: crawl.internalLinkCount,
            schema: crawl.hasJsonLd,
        },
        competitors: buildFallbackCompetitorsFromUserMetrics({
            url: crawl.url,
            score: score.total,
            wordCount: userWordCount,
            internalLinks: crawl.internalLinkCount,
        }),
    };
}
function buildCompetitorComparisonDataFromAudit(input, snapshots) {
    const competitors = snapshots.slice(0, 2).map((snapshot) => ({
        name: snapshot.competitor_name,
        url: snapshot.competitor_url,
        score: snapshot.score,
        titleLength: snapshot.title_length,
        h1: snapshot.h1_present,
        wordCount: snapshot.word_count,
        internalLinks: snapshot.internal_links,
        schema: snapshot.schema_present,
    }));
    return {
        user: {
            name: "Your Page",
            url: input.url,
            score: input.score,
            titleLength: input.titleLength,
            h1: input.h1Present,
            wordCount: input.wordCount,
            internalLinks: input.internalLinks,
            schema: input.schemaPresent,
        },
        competitors,
    };
}
function formatBoolean(value) {
    return value ? "Yes" : "No";
}
function titleLengthTone(length) {
    if (length >= 50 && length <= 65) {
        return "strong";
    }
    if (length < 40 || length > 70) {
        return "weak";
    }
    return "neutral";
}
function numericTone(value, values, options) {
    var _a;
    const higherIsBetter = (_a = options === null || options === void 0 ? void 0 : options.higherIsBetter) !== null && _a !== void 0 ? _a : true;
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
    const worst = higherIsBetter ? Math.min(...values) : Math.max(...values);
    if (value === best && value !== worst) {
        return "strong";
    }
    if (value === worst && value !== best) {
        return "weak";
    }
    return "neutral";
}
function buildComparisonRows(data) {
    var _a, _b;
    const competitorA = (_a = data.competitors[0]) !== null && _a !== void 0 ? _a : {
        name: "No competitor",
        score: 0,
        titleLength: 0,
        h1: false,
        wordCount: 0,
        internalLinks: 0,
        schema: false,
    };
    const competitorB = (_b = data.competitors[1]) !== null && _b !== void 0 ? _b : {
        name: "N/A",
        score: 0,
        titleLength: 0,
        h1: false,
        wordCount: 0,
        internalLinks: 0,
        schema: false,
    };
    const scoreValues = [data.user.score, ...data.competitors.map((item) => item.score)];
    const wordCountValues = [data.user.wordCount, ...data.competitors.map((item) => item.wordCount)];
    const internalLinkValues = [
        data.user.internalLinks,
        ...data.competitors.map((item) => item.internalLinks),
    ];
    return [
        {
            key: "score",
            label: "SEO Score",
            userValue: `${data.user.score}`,
            competitorAValue: data.competitors[0] ? `${competitorA.score}` : "-",
            competitorBValue: data.competitors[1] ? `${competitorB.score}` : "-",
            userTone: numericTone(data.user.score, scoreValues.length > 1 ? scoreValues : [data.user.score, 0]),
            competitorATone: data.competitors[0] ? numericTone(competitorA.score, scoreValues) : "neutral",
            competitorBTone: data.competitors[1] ? numericTone(competitorB.score, scoreValues) : "neutral",
        },
        {
            key: "titleLength",
            label: "Title Length",
            userValue: `${data.user.titleLength}`,
            competitorAValue: data.competitors[0] ? `${competitorA.titleLength}` : "-",
            competitorBValue: data.competitors[1] ? `${competitorB.titleLength}` : "-",
            userTone: titleLengthTone(data.user.titleLength),
            competitorATone: data.competitors[0] ? titleLengthTone(competitorA.titleLength) : "neutral",
            competitorBTone: data.competitors[1] ? titleLengthTone(competitorB.titleLength) : "neutral",
        },
        {
            key: "h1",
            label: "H1 Present",
            userValue: formatBoolean(data.user.h1),
            competitorAValue: data.competitors[0] ? formatBoolean(competitorA.h1) : "-",
            competitorBValue: data.competitors[1] ? formatBoolean(competitorB.h1) : "-",
            userTone: data.user.h1 ? "strong" : "weak",
            competitorATone: data.competitors[0] ? (competitorA.h1 ? "strong" : "weak") : "neutral",
            competitorBTone: data.competitors[1] ? (competitorB.h1 ? "strong" : "weak") : "neutral",
        },
        {
            key: "wordCount",
            label: "Word Count",
            userValue: `${data.user.wordCount}`,
            competitorAValue: data.competitors[0] ? `${competitorA.wordCount}` : "-",
            competitorBValue: data.competitors[1] ? `${competitorB.wordCount}` : "-",
            userTone: numericTone(data.user.wordCount, wordCountValues.length > 1 ? wordCountValues : [data.user.wordCount, 0]),
            competitorATone: data.competitors[0] ? numericTone(competitorA.wordCount, wordCountValues) : "neutral",
            competitorBTone: data.competitors[1] ? numericTone(competitorB.wordCount, wordCountValues) : "neutral",
        },
        {
            key: "internalLinks",
            label: "Internal Links",
            userValue: `${data.user.internalLinks}`,
            competitorAValue: data.competitors[0] ? `${competitorA.internalLinks}` : "-",
            competitorBValue: data.competitors[1] ? `${competitorB.internalLinks}` : "-",
            userTone: numericTone(data.user.internalLinks, internalLinkValues.length > 1 ? internalLinkValues : [data.user.internalLinks, 0]),
            competitorATone: data.competitors[0]
                ? numericTone(competitorA.internalLinks, internalLinkValues)
                : "neutral",
            competitorBTone: data.competitors[1]
                ? numericTone(competitorB.internalLinks, internalLinkValues)
                : "neutral",
        },
        {
            key: "schema",
            label: "Schema Present",
            userValue: formatBoolean(data.user.schema),
            competitorAValue: data.competitors[0] ? formatBoolean(competitorA.schema) : "-",
            competitorBValue: data.competitors[1] ? formatBoolean(competitorB.schema) : "-",
            userTone: data.user.schema ? "strong" : "weak",
            competitorATone: data.competitors[0] ? (competitorA.schema ? "strong" : "weak") : "neutral",
            competitorBTone: data.competitors[1] ? (competitorB.schema ? "strong" : "weak") : "neutral",
        },
    ];
}
function buildCompetitorInsights(data) {
    if (data.competitors.length === 0) {
        return {
            reasons: [],
            fixes: [],
        };
    }
    const averageWordCount = Math.round(data.competitors.reduce((sum, item) => sum + item.wordCount, 0) / data.competitors.length);
    const averageInternalLinks = Math.round(data.competitors.reduce((sum, item) => sum + item.internalLinks, 0) /
        data.competitors.length);
    const reasons = [];
    const fixes = [];
    if (data.user.wordCount < averageWordCount) {
        const gap = averageWordCount - data.user.wordCount;
        reasons.push(`Content depth is behind by about ${gap} words`);
        fixes.push(`Expand this page by at least ${Math.max(500, gap)} words of useful topic coverage`);
    }
    if (!data.user.h1 || data.user.titleLength > 70 || data.user.titleLength < 40) {
        reasons.push("Heading clarity is weaker than competing pages");
        fixes.push("Use one clear H1 and add focused H2 sections for intent, proof, and next steps");
    }
    if (data.user.internalLinks < averageInternalLinks) {
        const gap = averageInternalLinks - data.user.internalLinks;
        reasons.push(`Internal support is behind by about ${gap} links`);
        fixes.push(`Add at least ${Math.max(3, gap)} contextual internal links from related pages`);
    }
    if (!data.user.schema) {
        reasons.push("Competitors provide richer machine-readable context");
        fixes.push("Add schema markup that matches this page type");
    }
    if (reasons.length === 0) {
        reasons.push("Competitors are slightly ahead on on-page execution consistency");
    }
    if (fixes.length === 0) {
        fixes.push("Tighten structure and keep improving topical depth where intent is strongest");
    }
    return { reasons, fixes };
}
