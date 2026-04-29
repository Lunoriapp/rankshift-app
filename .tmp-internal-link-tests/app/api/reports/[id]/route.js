"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
exports.GET = GET;
const server_1 = require("next/server");
const example_report_1 = require("@/lib/example-report");
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
async function GET(request, { params }) {
    try {
        if (params.id === "101") {
            return server_1.NextResponse.json((0, example_report_1.getExampleReportPayload)());
        }
        const auth = await requireUser(request);
        if (!auth) {
            return server_1.NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
        }
        const audit = await (0, supabase_1.getAuditRecordById)(params.id, auth.token);
        if (!audit || audit.user_id !== auth.user.id) {
            return server_1.NextResponse.json({ error: "Report not found." }, { status: 404 });
        }
        const history = await (0, supabase_1.listAuditHistoryByUrl)(auth.user.id, audit.url_key, auth.token);
        const fixStates = await (0, supabase_1.listFixStatesByAudit)(auth.user.id, audit.id, auth.token);
        const competitorSnapshots = await (0, supabase_1.listCompetitorSnapshotsByAudit)(audit.id, auth.token);
        return server_1.NextResponse.json({
            audit,
            history,
            fixStates,
            competitorSnapshots,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load report.";
        return server_1.NextResponse.json({ error: message }, { status: 500 });
    }
}
