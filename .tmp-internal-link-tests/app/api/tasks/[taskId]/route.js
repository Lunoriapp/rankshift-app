"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.PATCH = PATCH;
const server_1 = require("next/server");
const supabase_1 = require("@/lib/supabase");
const workspace_activity_1 = require("@/lib/workspace-activity");
exports.runtime = "nodejs";
async function requireAuth(request) {
    const authorization = request.headers.get("authorization");
    if (!(authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer "))) {
        return null;
    }
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
        return null;
    }
    const user = await (0, supabase_1.getUserFromAccessToken)(token);
    if (!user) {
        return null;
    }
    return { userId: user.id, accessToken: token };
}
async function PATCH(request, { params }) {
    try {
        const body = (await request.json());
        if (typeof body.completed !== "boolean" ||
            typeof body.pageId !== "string" ||
            (body.auditId !== undefined && typeof body.auditId !== "string")) {
            return server_1.NextResponse.json({ error: "Invalid task completion payload." }, { status: 400 });
        }
        const auth = await requireAuth(request);
        if (!auth) {
            return server_1.NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
        }
        const task = await (0, workspace_activity_1.setTaskCompletionState)({
            accessToken: auth.accessToken,
            taskExternalKey: params.taskId,
            pageId: body.pageId,
            auditId: body.auditId,
            completed: body.completed,
            changedByUserId: auth.userId,
        });
        return server_1.NextResponse.json({ task });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update task.";
        return server_1.NextResponse.json({ error: message }, { status: 500 });
    }
}
