import { NextRequest, NextResponse } from "next/server";

import { getUserFromAccessToken } from "@/lib/supabase";
import { setTaskCompletionState } from "@/lib/workspace-activity";

export const runtime = "nodejs";

interface TaskCompletionBody {
  completed?: unknown;
  pageId?: unknown;
  auditId?: unknown;
}

async function getOptionalUserId(request: NextRequest): Promise<string | null> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  const user = await getUserFromAccessToken(token);
  return user?.id ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } },
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as TaskCompletionBody;

    if (
      typeof body.completed !== "boolean" ||
      typeof body.pageId !== "string" ||
      (body.auditId !== undefined && typeof body.auditId !== "string")
    ) {
      return NextResponse.json({ error: "Invalid task completion payload." }, { status: 400 });
    }

    const changedByUserId = await getOptionalUserId(request);
    const task = await setTaskCompletionState({
      taskExternalKey: params.taskId,
      pageId: body.pageId,
      auditId: body.auditId,
      completed: body.completed,
      changedByUserId,
    });

    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update task.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
