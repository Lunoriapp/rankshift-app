import { NextRequest, NextResponse } from "next/server";

import { getUserFromAccessToken, listSavedReportsByUser } from "@/lib/supabase";

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireUser(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const reports = await listSavedReportsByUser(auth.user.id, auth.token);
    return NextResponse.json({ reports });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load reports.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
