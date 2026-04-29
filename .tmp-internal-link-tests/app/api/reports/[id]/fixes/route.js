"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.POST = POST;
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
function isSeverity(value) {
    return value === "critical" || value === "high" || value === "medium";
}
async function POST(request, { params }) {
    try {
        const auth = await requireUser(request);
        if (!auth) {
            return server_1.NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
        }
        const body = (await request.json());
        if (typeof body.fixId !== "string" ||
            !isSeverity(body.severity) ||
            typeof body.completed !== "boolean") {
            return server_1.NextResponse.json({ error: "Invalid fix state payload." }, { status: 400 });
        }
        const state = await (0, supabase_1.upsertFixState)({
            userId: auth.user.id,
            accessToken: auth.token,
            auditId: params.id,
            fixId: body.fixId,
            severity: body.severity,
            completed: body.completed,
        });
        return server_1.NextResponse.json({ state });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update fix progress.";
        return server_1.NextResponse.json({ error: message }, { status: 500 });
    }
}
