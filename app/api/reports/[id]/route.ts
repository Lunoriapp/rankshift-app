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

  return getUserFromAccessToken(token);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    if (params.id === "101") {
      return NextResponse.json(getExampleReportPayload());
    }

    const user = await requireUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const audit = await getAuditRecordById(params.id);

    if (!audit || (audit.user_id && audit.user_id !== user.id)) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const history = await listAuditHistoryByUrl(user.id, audit.url_key);
    const fixStates = await listFixStatesByAudit(user.id, audit.id);
    const competitorSnapshots = await listCompetitorSnapshotsByAudit(audit.id);

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
