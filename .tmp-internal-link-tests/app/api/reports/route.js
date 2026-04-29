"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const supabase_1 = require("@/lib/supabase");
exports.runtime = "nodejs";
async function requireUser(request) {
    const authorization = request.headers.get("authorization");
    if (!(authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer "))) {
        return null;
    }
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
        return null;
    }
    const user = await (0, supabase_1.getUserFromAccessToken)(token);
    return user ? { user, token } : null;
}
async function GET(request) {
    try {
        const auth = await requireUser(request);
        if (!auth) {
            return server_1.NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
        }
        const reports = await (0, supabase_1.listSavedReportsByUser)(auth.user.id, auth.token);
        return server_1.NextResponse.json({ reports });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load reports.";
        return server_1.NextResponse.json({ error: message }, { status: 500 });
    }
}
