import { NextRequest, NextResponse } from "next/server";

import { getUserFromAccessToken } from "@/lib/supabase";
import { getWorkspacePageProgressCounts } from "@/lib/workspace-activity";

export const runtime = "nodejs";

async function requireAccessToken(request: NextRequest): Promise<string | null> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  const user = await getUserFromAccessToken(token);
  return user ? token : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; pageId: string } },
): Promise<NextResponse> {
  try {
    const accessToken = await requireAccessToken(request);

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const counts = await getWorkspacePageProgressCounts({
      workspaceId: params.workspaceId,
      pageId: params.pageId,
      accessToken,
    });

    return NextResponse.json({ counts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load progress counts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
