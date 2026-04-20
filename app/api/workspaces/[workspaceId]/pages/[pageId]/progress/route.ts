import { NextResponse } from "next/server";

import { getWorkspacePageProgressCounts } from "@/lib/workspace-activity";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { workspaceId: string; pageId: string } },
): Promise<NextResponse> {
  try {
    const counts = await getWorkspacePageProgressCounts({
      workspaceId: params.workspaceId,
      pageId: params.pageId,
    });

    return NextResponse.json({ counts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load progress counts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
