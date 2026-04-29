"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.POST = POST;
const server_1 = require("next/server");
const ai_1 = require("@/lib/ai");
const audit_fixes_1 = require("@/lib/audit-fixes");
const crawler_1 = require("@/lib/crawler");
const findLinkOpportunities_1 = require("@/lib/internalLinking/findLinkOpportunities");
const rate_limit_1 = require("@/lib/rate-limit");
const scorer_1 = require("@/lib/scorer");
const supabase_1 = require("@/lib/supabase");
const url_1 = require("@/lib/utils/url");
exports.runtime = "nodejs";
const AUDIT_ROUTE_VERSION = "AUDIT_API_V4";
function jsonNoStore(body, init) {
    const headers = new Headers(init === null || init === void 0 ? void 0 : init.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    return server_1.NextResponse.json(body, Object.assign(Object.assign({}, init), { headers }));
}
function getErrorMessage(error, fallback) {
    if (error instanceof Error) {
        const message = error.message.trim();
        return message.length > 0 ? message : fallback;
    }
    if (typeof error === "string") {
        const message = error.trim();
        return message.length > 0 ? message : fallback;
    }
    if (error && typeof error === "object") {
        const record = error;
        if (typeof record.message === "string" && record.message.trim().length > 0) {
            return record.message.trim();
        }
        try {
            const serialized = JSON.stringify(error);
            if (serialized && serialized !== "{}") {
                return serialized;
            }
        }
        catch (_a) {
            return fallback;
        }
    }
    return fallback;
}
async function resolveUser(request) {
    const authorization = request.headers.get("authorization");
    if (!(authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer "))) {
        return null;
    }
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
        return null;
    }
    const user = await (0, supabase_1.getUserFromAccessToken)(token);
    return user ? { id: user.id, token } : null;
}
async function POST(request) {
    var _a, _b, _c;
    try {
        let body;
        try {
            body = (await request.json());
        }
        catch (_d) {
            return jsonNoStore({ error: `${AUDIT_ROUTE_VERSION}: Invalid request body.` }, { status: 400 });
        }
        if (typeof body.url !== "string" || body.url.trim().length === 0) {
            return jsonNoStore({ error: `${AUDIT_ROUTE_VERSION}: A valid URL is required.` }, { status: 400 });
        }
        let normalizedUrl;
        try {
            normalizedUrl = (0, url_1.normalizeUrl)(body.url);
        }
        catch (_e) {
            return jsonNoStore({ error: `${AUDIT_ROUTE_VERSION}: Invalid URL.` }, { status: 400 });
        }
        let normalizedCompetitorUrl = null;
        if (typeof body.competitorUrl === "string" && body.competitorUrl.trim().length > 0) {
            try {
                normalizedCompetitorUrl = (0, url_1.normalizeUrl)(body.competitorUrl);
            }
            catch (_f) {
                return jsonNoStore({ error: `${AUDIT_ROUTE_VERSION}: Invalid competitor URL.` }, { status: 400 });
            }
        }
        const ip = (0, rate_limit_1.getClientIp)(request);
        const resolvedUser = await resolveUser(request);
        if (!resolvedUser) {
            return jsonNoStore({ error: `${AUDIT_ROUTE_VERSION}: Unauthenticated.` }, { status: 401 });
        }
        try {
            await (0, rate_limit_1.enforceRateLimit)(ip, resolvedUser.token);
        }
        catch (error) {
            if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
                return jsonNoStore({ error: `${AUDIT_ROUTE_VERSION}: Daily request limit reached for this IP.` }, { status: 429 });
            }
            throw error;
        }
        let crawl;
        try {
            crawl = await (0, crawler_1.crawlPage)(normalizedUrl);
        }
        catch (error) {
            throw new Error(getErrorMessage(error, "Crawling failed."));
        }
        try {
            const sitePages = await (0, crawler_1.crawlSiteForInternalLinking)(normalizedUrl, 72);
            const fullReport = (0, findLinkOpportunities_1.findLinkOpportunities)(sitePages, 48);
            const sourceOnlyReport = (0, findLinkOpportunities_1.findLinkOpportunities)(sitePages, 16, {
                sourceUrl: normalizedUrl,
            });
            const sourceOnlyKeys = new Set(sourceOnlyReport.opportunities.map((entry) => { var _a, _b; return `${entry.sourceUrl}|${entry.targetUrl}|${((_b = (_a = entry.suggestedAnchor) !== null && _a !== void 0 ? _a : entry.rewriteSuggestion) !== null && _b !== void 0 ? _b : "rewrite").toLowerCase()}`; }));
            const mergedRaw = [
                ...sourceOnlyReport.opportunities,
                ...fullReport.opportunities.filter((entry) => {
                    var _a, _b;
                    return !sourceOnlyKeys.has(`${entry.sourceUrl}|${entry.targetUrl}|${((_b = (_a = entry.suggestedAnchor) !== null && _a !== void 0 ? _a : entry.rewriteSuggestion) !== null && _b !== void 0 ? _b : "rewrite").toLowerCase()}`);
                }),
            ];
            const bestByOpportunity = new Map();
            for (const entry of mergedRaw) {
                const anchorKey = ((_b = (_a = entry.suggestedAnchor) !== null && _a !== void 0 ? _a : entry.rewriteSuggestion) !== null && _b !== void 0 ? _b : "rewrite").toLowerCase();
                const opportunityKey = `${entry.sourceUrl}|${entry.targetUrl}|${anchorKey}`;
                const existing = bestByOpportunity.get(opportunityKey);
                if (!existing || entry.confidenceScore > existing.confidenceScore) {
                    bestByOpportunity.set(opportunityKey, entry);
                }
            }
            const merged = [...bestByOpportunity.values()]
                .sort((a, b) => b.confidenceScore - a.confidenceScore)
                .slice(0, 48);
            crawl.internalLinking = Object.assign(Object.assign({}, fullReport), { opportunities: merged });
            console.debug("[audit-api][internal-linking][summary]", {
                sitePagesDiscovered: sitePages.length,
                opportunities: crawl.internalLinking.opportunities.length,
                scannedPageCount: crawl.internalLinking.scannedPageCount,
                diagnostics: (_c = crawl.internalLinking.diagnostics) !== null && _c !== void 0 ? _c : null,
            });
        }
        catch (error) {
            console.error("[audit-api][internal-linking][error]", {
                message: getErrorMessage(error, "Internal linking generation failed."),
            });
            crawl.internalLinking = {
                pages: [],
                opportunities: [],
                scannedPageCount: 0,
                debug: [],
                diagnostics: {
                    pagesInput: 0,
                    pagesWithUsableContent: 0,
                    internalLinksExtracted: 0,
                    candidateSourcePages: 0,
                    candidateDestinationPages: 0,
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
                },
            };
        }
        const score = (0, scorer_1.scoreAudit)(crawl);
        let aiOutput;
        try {
            aiOutput = await (0, ai_1.generateFixes)(crawl, score);
        }
        catch (error) {
            throw new Error(getErrorMessage(error, "AI fix generation failed."));
        }
        const fixes = (0, audit_fixes_1.buildAuditFixes)(crawl, score, aiOutput);
        let competitorSnapshots;
        let competitorStatus = "not_provided";
        if (normalizedCompetitorUrl) {
            try {
                const competitorCrawl = await (0, crawler_1.crawlPage)(normalizedCompetitorUrl);
                const competitorScore = (0, scorer_1.scoreAudit)(competitorCrawl);
                competitorSnapshots = [
                    {
                        name: competitorCrawl.title.trim().length > 0
                            ? competitorCrawl.title
                            : new URL(competitorCrawl.url).hostname.replace(/^www\./, ""),
                        url: competitorCrawl.url,
                        score: competitorScore.total,
                        titleLength: competitorCrawl.title.trim().length,
                        h1: competitorCrawl.h1.trim().length > 0,
                        wordCount: competitorCrawl.bodyText.split(/\s+/).filter(Boolean).length,
                        internalLinks: competitorCrawl.internalLinkCount,
                        schema: competitorCrawl.hasJsonLd,
                    },
                ];
                competitorStatus = "ok";
            }
            catch (error) {
                competitorStatus = "failed";
                console.error("[audit-api][competitor][error]", {
                    competitorUrl: normalizedCompetitorUrl,
                    message: getErrorMessage(error, "Competitor crawl failed."),
                });
            }
        }
        let id;
        try {
            id = await (0, supabase_1.createAuditRecord)({
                userId: resolvedUser.id,
                accessToken: resolvedUser.token,
                url: normalizedUrl,
                crawl: Object.assign(Object.assign({}, crawl), { internalLinking: crawl.internalLinking
                        ? Object.assign(Object.assign({}, crawl.internalLinking), { 
                            // Persist only the actionable output; debug/pages can become very large and time out inserts.
                            pages: [], debug: [] }) : undefined }),
                score,
                aiOutput,
                fixes,
                competitorSnapshots,
            });
        }
        catch (error) {
            const message = getErrorMessage(error, "Saving the audit failed.");
            console.error("[audit-api] AUDIT_WRITE_V3", {
                userId: resolvedUser.id,
                url: normalizedUrl,
                message,
            });
            throw new Error(`AUDIT_WRITE_V3: ${message}`);
        }
        return jsonNoStore({ id, competitorStatus });
    }
    catch (error) {
        const message = getErrorMessage(error, "Unexpected audit processing error.");
        console.error("[audit-api] AUDIT_API_V3", { message });
        return jsonNoStore({ error: `${AUDIT_ROUTE_VERSION}: ${message}` }, { status: 500 });
    }
}
