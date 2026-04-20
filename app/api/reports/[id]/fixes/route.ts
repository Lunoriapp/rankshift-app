import { NextRequest, NextResponse } from "next/server";

import type { FixSeverity } from "@/lib/audit-fixes";
import { getUserFromAccessToken, upsertFixState } from "@/lib/supabase";

export const runtime = "nodejs";

interface FixStateBody {
  fixId?: unknown;
  severity?: unknown;
  completed?: unknown;
}

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

function isSeverity(value: unknown): value is FixSeverity {
  return value === "critical" || value === "high" || value === "medium";
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const user = await requireUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const body = (await request.json()) as FixStateBody;

    if (
      typeof body.fixId !== "string" ||
      !isSeverity(body.severity) ||
      typeof body.completed !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid fix state payload." }, { status: 400 });
    }

    const state = await upsertFixState({
      userId: user.id,
      auditId: Number(params.id),
      fixId: body.fixId,
      severity: body.severity,
      completed: body.completed,
    });

    return NextResponse.json({ state });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update fix progress.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
