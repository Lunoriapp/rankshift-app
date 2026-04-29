"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const supabase_1 = require("@/lib/supabase");
const workspace_activity_1 = require("@/lib/workspace-activity");
exports.runtime = "nodejs";
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
    try {
        const accessToken = await requireAccessToken(request);
        if (!accessToken) {
            return server_1.NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
        }
        const counts = await (0, workspace_activity_1.getWorkspacePageProgressCounts)({
            workspaceId: params.workspaceId,
            pageId: params.pageId,
            accessToken,
        });
        return server_1.NextResponse.json({ counts });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load progress counts.";
        return server_1.NextResponse.json({ error: message }, { status: 500 });
    }
}
