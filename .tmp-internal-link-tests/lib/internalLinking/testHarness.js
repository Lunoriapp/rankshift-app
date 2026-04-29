"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInternalLinkHarnessResult = logInternalLinkHarnessResult;
exports.runInternalLinkingDebugHarness = runInternalLinkingDebugHarness;
exports.runControlledInternalLinkTruthTest = runControlledInternalLinkTruthTest;
const playwright_1 = require("playwright");
const editorialExtractor_1 = require("@/lib/internalLinking/editorialExtractor");
const analyseSiteTopics_1 = require("@/lib/internalLinking/analyseSiteTopics");
const findLinkOpportunities_1 = require("@/lib/internalLinking/findLinkOpportunities");
function buildSyntheticTargetBody(target) {
    return [
        target.title,
        target.h1,
        ...target.h2s,
        `${target.h1} helps users understand the page focus and the offer in more detail.`,
        `${target.title} explains the main topic with enough repeated context for phrase extraction.`,
        `This page also covers ${target.h2s.join(", ")} and related guidance for the same topic.`,
    ]
        .filter(Boolean)
        .join(" ");
}
function buildTargetSnapshot(target) {
    const syntheticBody = buildSyntheticTargetBody(target);
    return {
        url: target.url,
        title: target.title,
        description: "",
        h1: target.h1,
        h2s: target.h2s,
        headings: [
            { level: 1, text: target.h1 },
            ...target.h2s.map((heading) => ({ level: 2, text: heading })),
        ],
        images: [],
        bodyText: syntheticBody,
        contentSections: [
            {
                label: "Introduction",
                text: syntheticBody,
                type: "paragraph",
            },
        ],
        contentDebug: {
            selectedContentSelector: "synthetic-target",
            totalHeadingCount: 1 + target.h2s.length,
            paragraphCount: 1,
            listItemCount: 0,
            extractedBlockCount: 1,
            firstExtractedTextChunks: [syntheticBody],
            fallbackStrategyUsed: false,
            headingCounts: {
                h1: 1,
                h2: target.h2s.length,
                h3: 0,
                h4: 0,
            },
            headingTexts: {
                h1: [target.h1],
                h2: target.h2s,
                h3: [],
                h4: [],
            },
            hasMultipleVisibleH1: false,
            contextualBodyLinks: [],
            blockedAnchorPhrases: [],
        },
        existingInternalLinks: [],
        canonical: null,
        robots: null,
        indexable: true,
        statusCode: 200,
        contentType: "text/html",
        hasJsonLd: false,
    };
}
function logInternalLinkHarnessResult(result) {
    console.debug(`[internal-link-harness] selector=${result.extractedContentSummary.selectedContentSelector}`);
    console.debug(`[internal-link-harness] headings h1=${result.extractedContentSummary.headingCounts.h1} h2=${result.extractedContentSummary.headingCounts.h2} h3=${result.extractedContentSummary.headingCounts.h3} h4=${result.extractedContentSummary.headingCounts.h4}`);
    console.debug(`[internal-link-harness] heading_texts h1=${result.extractedContentSummary.extractedHeadings.h1.join(" | ") || "(none)"}`);
    console.debug(`[internal-link-harness] heading_texts h2=${result.extractedContentSummary.extractedHeadings.h2.join(" | ") || "(none)"}`);
    console.debug(`[internal-link-harness] heading_texts h3=${result.extractedContentSummary.extractedHeadings.h3.join(" | ") || "(none)"}`);
    console.debug(`[internal-link-harness] paragraph_count=${result.extractedContentSummary.paragraphCount} chunks=${result.extractedContentSummary.extractedChunkCount}`);
    for (const [index, chunk] of result.extractedContentSummary.firstFiveTextChunks.entries()) {
        console.debug(`[internal-link-harness] chunk_${index + 1}=${chunk}`);
    }
    console.debug(`[internal-link-harness] contextual_links=${result.extractedContentSummary.contextualBodyLinks
        .map((link) => `${link.text} -> ${link.href}`)
        .join(" || ") || "(none)"}`);
    for (const target of result.targetPhraseList) {
        console.debug(`[internal-link-harness] target=${target.targetUrl} phrases=${target.phrases.join(" | ") || "(none)"}`);
    }
    for (const matched of result.matchedChunks) {
        console.debug(`[internal-link-harness] matched_chunks target=${matched.targetUrl} snippets=${matched.snippets.join(" || ") || "(none)"}`);
    }
    for (const evaluation of result.rejectionReasons) {
        console.debug(`[internal-link-harness] decision=${evaluation.decision} target=${evaluation.targetUrl}`);
        console.debug(`[internal-link-harness] matched_snippets=${evaluation.matchedSnippets.join(" || ") || "(none)"}`);
        for (const reason of evaluation.reasons) {
            console.debug(`[internal-link-harness] reason=${reason}`);
        }
    }
    for (const opportunity of result.opportunitiesFound) {
        console.debug(`[internal-link-harness] opportunity source=${opportunity.sourceUrl} target=${opportunity.targetUrl} anchor=${opportunity.suggestedAnchor} confidence=${opportunity.confidence}`);
        console.debug(`[internal-link-harness] opportunity_snippet=${opportunity.matchedSnippet}`);
        console.debug(`[internal-link-harness] opportunity_placement=${opportunity.placementHint}`);
    }
}
async function runInternalLinkingDebugHarness(input) {
    var _a, _b, _c, _d;
    const browser = await playwright_1.chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(input.sourceHtml, { waitUntil: "domcontentloaded" });
        const editorial = await page.evaluate(editorialExtractor_1.extractEditorialContentInBrowser, {
            cookiePatterns: ["cookie", "consent", "privacy", "gdpr"],
            currentUrl: input.sourceUrl,
        });
        const sourceSnapshot = {
            url: input.sourceUrl,
            title: (_a = input.sourceTitle) !== null && _a !== void 0 ? _a : "Source Page",
            description: (_b = input.sourceDescription) !== null && _b !== void 0 ? _b : "",
            h1: editorial.h1,
            h2s: editorial.h2s,
            headings: editorial.headings,
            images: [],
            bodyText: editorial.bodyText,
            contentSections: editorial.contentSections,
            contentDebug: editorial.contentDebug,
            existingInternalLinks: editorial.existingInternalLinks,
            canonical: null,
            robots: null,
            indexable: true,
            statusCode: 200,
            contentType: "text/html",
            hasJsonLd: false,
        };
        const targetSnapshots = input.targets.map(buildTargetSnapshot);
        const report = (0, findLinkOpportunities_1.findLinkOpportunities)([sourceSnapshot, ...targetSnapshots], 50);
        const targetProfiles = (0, analyseSiteTopics_1.analyseSiteTopics)(targetSnapshots);
        const sourceDebug = report.debug.find((entry) => entry.sourceUrl === input.sourceUrl);
        const result = {
            extractedContentSummary: {
                sourceUrl: input.sourceUrl,
                selectedContentSelector: editorial.contentDebug.selectedContentSelector,
                paragraphCount: editorial.contentDebug.paragraphCount,
                extractedChunkCount: editorial.contentDebug.extractedBlockCount,
                firstFiveTextChunks: editorial.contentDebug.firstExtractedTextChunks,
                headingCounts: editorial.contentDebug.headingCounts,
                extractedHeadings: editorial.contentDebug.headingTexts,
                contextualBodyLinks: editorial.contentDebug.contextualBodyLinks,
            },
            targetPhraseList: targetProfiles.map((profile) => ({
                targetUrl: profile.url,
                targetTitle: profile.title,
                phrases: profile.topicPhrases.map((phrase) => phrase.phrase),
            })),
            matchedChunks: (_c = sourceDebug === null || sourceDebug === void 0 ? void 0 : sourceDebug.targetEvaluations.map((evaluation) => ({
                targetUrl: evaluation.targetUrl,
                snippets: evaluation.matchedSnippets,
            }))) !== null && _c !== void 0 ? _c : [],
            opportunitiesFound: report.opportunities.filter((opportunity) => opportunity.sourceUrl === input.sourceUrl),
            rejectionReasons: (_d = sourceDebug === null || sourceDebug === void 0 ? void 0 : sourceDebug.targetEvaluations.map((evaluation) => ({
                targetUrl: evaluation.targetUrl,
                decision: evaluation.decision,
                reasons: evaluation.reasons,
                matchedSnippets: evaluation.matchedSnippets,
            }))) !== null && _d !== void 0 ? _d : [],
        };
        if (input.debugMode) {
            logInternalLinkHarnessResult(result);
        }
        return result;
    }
    finally {
        await browser.close();
    }
}
async function runControlledInternalLinkTruthTest(input) {
    var _a;
    return runInternalLinkingDebugHarness({
        sourceHtml: input.sourceHtml,
        sourceUrl: input.sourceUrl,
        sourceTitle: input.sourceTitle,
        targets: [
            {
                url: input.targetUrl,
                title: input.targetTitle,
                h1: input.targetH1,
                h2s: (_a = input.targetH2s) !== null && _a !== void 0 ? _a : [],
            },
        ],
        debugMode: input.debugMode,
    });
}
