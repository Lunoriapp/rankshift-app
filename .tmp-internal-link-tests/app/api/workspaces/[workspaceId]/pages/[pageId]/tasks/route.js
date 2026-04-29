"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const supabase_1 = require("@/lib/supabase");
const workspace_activity_1 = require("@/lib/workspace-activity");
exports.runtime = "nodejs";
function isSeoTask(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const task = value;
    return (typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.whatIsWrong === "string" &&
        typeof task.whyItMatters === "string" &&
        typeof task.whatToDo === "string" &&
        (task.priority === "High" || task.priority === "Medium" || task.priority === "Low") &&
        (task.completionState === "open" || task.completionState === "completed") &&
        (task.dateCompleted === null || typeof task.dateCompleted === "string"));
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
        const tasks = await (0, workspace_activity_1.listTasksByWorkspaceAndPage)({
            workspaceId: params.workspaceId,
            pageId: params.pageId,
            accessToken,
            auditId,
        });
        return server_1.NextResponse.json({ tasks });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load tasks.";
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
            !Array.isArray(body.tasks) ||
            !body.tasks.every(isSeoTask)) {
            return server_1.NextResponse.json({ error: "Invalid task sync payload." }, { status: 400 });
        }
        const tasks = await (0, workspace_activity_1.syncTasksForPage)({
            workspaceId: params.workspaceId,
            pageId: params.pageId,
            accessToken,
            auditId: body.auditId,
            tasks: body.tasks,
        });
        return server_1.NextResponse.json({ tasks });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save tasks.";
        return server_1.NextResponse.json({ error: message }, { status: 500 });
    }
}
