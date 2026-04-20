import { NextRequest, NextResponse } from "next/server";

import type { InternalLinkOpportunity } from "@/lib/internalLinking/types";
import {
  listInternalLinkOpportunitiesByWorkspaceAndPage,
  syncInternalLinkOpportunitiesForPage,
} from "@/lib/workspace-activity";

export const runtime = "nodejs";

interface InternalLinkSyncBody {
  auditId?: unknown;
  opportunities?: unknown;
}

function isInternalLinkOpportunity(value: unknown): value is InternalLinkOpportunity {
  if (!value || typeof value !== "object") {
    return false;
  }

  const opportunity = value as Record<string, unknown>;

  return (
    typeof opportunity.id === "string" &&
    typeof opportunity.sourceUrl === "string" &&
    typeof opportunity.sourceTitle === "string" &&
    typeof opportunity.targetUrl === "string" &&
    typeof opportunity.targetTitle === "string" &&
    typeof opportunity.suggestedAnchor === "string" &&
    typeof opportunity.matchedSnippet === "string" &&
    typeof opportunity.placementHint === "string" &&
    typeof opportunity.reason === "string" &&
    (opportunity.confidence === "High" ||
      opportunity.confidence === "Medium" ||
      opportunity.confidence === "Low") &&
    (opportunity.status === "open" || opportunity.status === "completed")
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; pageId: string } },
): Promise<NextResponse> {
  try {
    const auditId = request.nextUrl.searchParams.get("auditId") ?? undefined;
    const opportunities = await listInternalLinkOpportunitiesByWorkspaceAndPage({
      workspaceId: params.workspaceId,
      pageId: params.pageId,
      auditId,
    });

    return NextResponse.json({ opportunities });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load internal link opportunities.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string; pageId: string } },
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as InternalLinkSyncBody;

    if (
      typeof body.auditId !== "string" ||
      !Array.isArray(body.opportunities) ||
      !body.opportunities.every(isInternalLinkOpportunity)
    ) {
      return NextResponse.json(
        { error: "Invalid internal link opportunity payload." },
        { status: 400 },
      );
    }

    const opportunities = await syncInternalLinkOpportunitiesForPage({
      workspaceId: params.workspaceId,
      pageId: params.pageId,
      auditId: body.auditId,
      opportunities: body.opportunities,
    });

    return NextResponse.json({ opportunities });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save internal link opportunities.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
