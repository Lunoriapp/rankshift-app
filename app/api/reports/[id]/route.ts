import { NextRequest, NextResponse } from "next/server";

import { getExampleReportPayload } from "@/lib/example-report";
import {
  getAuditRecordById,
  getUserFromAccessToken,
  listAuditHistoryByUrl,
  listCompetitorSnapshotsByAudit,
  listFixStatesByAudit,
} from "@/lib/supabase";

export const runtime = "nodejs";

async function requireUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  const user = await getUserFromAccessToken(token);
  return user ? { user, token } : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    if (params.id === "101") {
      return NextResponse.json(getExampleReportPayload());
    }

    const auth = await requireUser(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const audit = await getAuditRecordById(params.id, auth.token);

    if (!audit || audit.user_id !== auth.user.id) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const history = await listAuditHistoryByUrl(auth.user.id, audit.url_key, auth.token);
    const fixStates = await listFixStatesByAudit(auth.user.id, audit.id, auth.token);
    const competitorSnapshots = await listCompetitorSnapshotsByAudit(audit.id, auth.token);

    return NextResponse.json({
      audit,
      history,
      fixStates,
      competitorSnapshots,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
