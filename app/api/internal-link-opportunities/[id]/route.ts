import { NextRequest, NextResponse } from "next/server";

import { getUserFromAccessToken } from "@/lib/supabase";
import { setInternalLinkOpportunityCompletionState } from "@/lib/workspace-activity";

export const runtime = "nodejs";

interface InternalLinkCompletionBody {
  completed?: unknown;
  pageId?: unknown;
  auditId?: unknown;
}

async function requireAuth(request: NextRequest): Promise<{ accessToken: string } | null> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  const user = await getUserFromAccessToken(token);
  return user ? { accessToken: token } : null;
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

    const auth = await requireAuth(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const opportunity = await setInternalLinkOpportunityCompletionState({
      accessToken: auth.accessToken,
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
