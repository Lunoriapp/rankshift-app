"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const supabase_1 = require("@/lib/supabase");
const workspace_activity_1 = require("@/lib/workspace-activity");
exports.runtime = "nodejs";
function isInternalLinkOpportunity(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const opportunity = value;
    return (typeof opportunity.id === "string" &&
        typeof opportunity.sourceUrl === "string" &&
        typeof opportunity.sourceTitle === "string" &&
        typeof opportunity.targetUrl === "string" &&
        typeof opportunity.targetTitle === "string" &&
        (typeof opportunity.suggestedAnchor === "string" || opportunity.suggestedAnchor === null) &&
        (typeof opportunity.rewriteSuggestion === "undefined" ||
            typeof opportunity.rewriteSuggestion === "string" ||
            opportunity.rewriteSuggestion === null) &&
        typeof opportunity.matchedSnippet === "string" &&
        typeof opportunity.placementHint === "string" &&
        typeof opportunity.reason === "string" &&
        (opportunity.confidence === "High" ||
            opportunity.confidence === "Medium" ||
            opportunity.confidence === "Low") &&
        (opportunity.status === "open" || opportunity.status === "completed"));
}
async function requireAccessToken(request) {
    const authorization = request.headers.get("authorization");
    if (!(authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer "))) {
        return null;
    }
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
        return null;
    }
    const user = await (0, supabase_1.getUserFromAccessToken)(token);
    return user ? token : null;
}
async function GET(request, { params }) {
    var _a;
    try {
        const accessToken = await requireAccessToken(request);
        if (!accessToken) {
            return server_1.NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
        }
        const auditId = (_a = request.nextUrl.searchParams.get("auditId")) !== null && _a !== void 0 ? _a : undefined;
        const opportunities = await (0, workspace_activity_1.listInternalLinkOpportunitiesByWorkspaceAndPage)({
            workspaceId: params.workspaceId,
            pageId: params.pageId,
            accessToken,
            auditId,
        });
        return server_1.NextResponse.json({ opportunities });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load internal link opportunities.";
        return server_1.NextResponse.json({ error: message }, { status: 500 });
    }
}
async function POST(request, { params }) {
    try {
        const accessToken = await requireAccessToken(request);
        if (!accessToken) {
            return server_1.NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
        }
        const body = (await request.json());
        if (typeof body.auditId !== "string" ||
            !Array.isArray(body.opportunities) ||
            !body.opportunities.every(isInternalLinkOpportunity)) {
            return server_1.NextResponse.json({ error: "Invalid internal link opportunity payload." }, { status: 400 });
        }
        const opportunities = await (0, workspace_activity_1.syncInternalLinkOpportunitiesForPage)({
            workspaceId: params.workspaceId,
            pageId: params.pageId,
            accessToken,
            auditId: body.auditId,
            opportunities: body.opportunities,
        });
        return server_1.NextResponse.json({ opportunities });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save internal link opportunities.";
        return server_1.NextResponse.json({ error: message }, { status: 500 });
    }
}
