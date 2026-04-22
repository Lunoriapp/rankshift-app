import { NextRequest, NextResponse } from "next/server";

import { getUserFromAccessToken } from "@/lib/supabase";
import {
  listTasksByWorkspaceAndPage,
  syncTasksForPage,
} from "@/lib/workspace-activity";
import type { SeoTask } from "@/lib/task-system";

export const runtime = "nodejs";

interface TaskSyncBody {
  auditId?: unknown;
  tasks?: unknown;
}

function isSeoTask(value: unknown): value is SeoTask {
  if (!value || typeof value !== "object") {
    return false;
  }

  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.whatIsWrong === "string" &&
    typeof task.whyItMatters === "string" &&
    typeof task.whatToDo === "string" &&
    (task.priority === "High" || task.priority === "Medium" || task.priority === "Low") &&
    (task.completionState === "open" || task.completionState === "completed") &&
    (task.dateCompleted === null || typeof task.dateCompleted === "string")
  );
}

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

    const auditId = request.nextUrl.searchParams.get("auditId") ?? undefined;
    const tasks = await listTasksByWorkspaceAndPage({
      workspaceId: params.workspaceId,
      pageId: params.pageId,
      accessToken,
      auditId,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load tasks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string; pageId: string } },
): Promise<NextResponse> {
  try {
    const accessToken = await requireAccessToken(request);

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const body = (await request.json()) as TaskSyncBody;

    if (
      typeof body.auditId !== "string" ||
      !Array.isArray(body.tasks) ||
      !body.tasks.every(isSeoTask)
    ) {
      return NextResponse.json({ error: "Invalid task sync payload." }, { status: 400 });
    }

    const tasks = await syncTasksForPage({
      workspaceId: params.workspaceId,
      pageId: params.pageId,
      accessToken,
      auditId: body.auditId,
      tasks: body.tasks,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save tasks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
