import { NextRequest, NextResponse } from "next/server";

import { generateFixes } from "@/lib/ai";
import { buildAuditFixes } from "@/lib/audit-fixes";
import { crawlPage, crawlSiteForInternalLinking } from "@/lib/crawler";
import { findLinkOpportunities } from "@/lib/internalLinking/findLinkOpportunities";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { scoreAudit } from "@/lib/scorer";
import { createAuditRecord, getUserFromAccessToken } from "@/lib/supabase";

export const runtime = "nodejs";

interface AuditRequestBody {
  url?: unknown;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    return message.length > 0 ? message : fallback;
  }

  if (typeof error === "string") {
    const message = error.trim();
    return message.length > 0 ? message : fallback;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim().length > 0) {
      return record.message.trim();
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") {
        return serialized;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function normalizeUrl(value: string): string {
  const candidate = value.trim();
  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("URL protocol must be HTTP or HTTPS.");
  }

  return parsed.toString();
}

async function resolveUserId(request: NextRequest): Promise<string | null> {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: AuditRequestBody;

    try {
      body = (await request.json()) as AuditRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (typeof body.url !== "string" || body.url.trim().length === 0) {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    let normalizedUrl: string;

    try {
      normalizedUrl = normalizeUrl(body.url);
    } catch {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }

    const ip = getClientIp(request);
    const userId = await resolveUserId(request);

    try {
      await enforceRateLimit(ip);
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        return NextResponse.json(
          { error: "Daily request limit reached for this IP." },
          { status: 429 },
        );
      }

      throw error;
    }

    let crawl;

    try {
      crawl = await crawlPage(normalizedUrl);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Crawling failed."));
    }

    try {
      const sitePages = await crawlSiteForInternalLinking(normalizedUrl, 24);
      crawl.internalLinking = findLinkOpportunities(sitePages, 24);
    } catch {
      crawl.internalLinking = {
        pages: [],
        opportunities: [],
        scannedPageCount: 0,
        debug: [],
      };
    }

    const score = scoreAudit(crawl);

    let aiOutput;

    try {
      aiOutput = await generateFixes(crawl, score);
    } catch (error) {
      throw new Error(getErrorMessage(error, "AI fix generation failed."));
    }

    const fixes = buildAuditFixes(crawl, score, aiOutput);

    let id: number;

    try {
      id = await createAuditRecord({
        userId,
        url: normalizedUrl,
        crawl,
        score,
        aiOutput,
        fixes,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error, "Saving the audit failed."));
    }

    return NextResponse.json({ id });
  } catch (error) {
    const message = getErrorMessage(error, "Unexpected audit processing error.");

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
