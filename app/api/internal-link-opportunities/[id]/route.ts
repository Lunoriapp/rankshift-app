import { NextRequest, NextResponse } from "next/server";

import { setInternalLinkOpportunityCompletionState } from "@/lib/workspace-activity";

export const runtime = "nodejs";

interface InternalLinkCompletionBody {
  completed?: unknown;
  pageId?: unknown;
  auditId?: unknown;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as InternalLinkCompletionBody;

    if (
      typeof body.completed !== "boolean" ||
      typeof body.pageId !== "string" ||
      (body.auditId !== undefined && typeof body.auditId !== "string")
    ) {
      return NextResponse.json(
        { error: "Invalid internal link completion payload." },
        { status: 400 },
      );
    }

    const opportunity = await setInternalLinkOpportunityCompletionState({
      externalKey: params.id,
      pageId: body.pageId,
      auditId: body.auditId,
      completed: body.completed,
    });

    return NextResponse.json({ opportunity });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update internal link opportunity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
