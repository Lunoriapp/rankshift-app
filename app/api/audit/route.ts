import { NextRequest, NextResponse } from "next/server";

import { generateFixes } from "@/lib/ai";
import { buildAuditFixes } from "@/lib/audit-fixes";
import type { CompetitorSnapshot } from "@/lib/competitor-comparison";
import { crawlPage, crawlSiteForInternalLinking } from "@/lib/crawler";
import { findLinkOpportunities } from "@/lib/internalLinking/findLinkOpportunities";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { scoreAudit } from "@/lib/scorer";
import { createAuditRecord, getUserFromAccessToken } from "@/lib/supabase";
import { normalizeUrl } from "@/lib/utils/url";

export const runtime = "nodejs";
const AUDIT_ROUTE_VERSION = "AUDIT_API_V4";

interface AuditRequestBody {
  url?: unknown;
  competitorUrl?: unknown;
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

async function resolveUser(request: NextRequest): Promise<{ id: string; token: string } | null> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  const user = await getUserFromAccessToken(token);
  return user ? { id: user.id, token } : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: AuditRequestBody;

    try {
      body = (await request.json()) as AuditRequestBody;
    } catch {
      return NextResponse.json(
        { error: `${AUDIT_ROUTE_VERSION}: Invalid request body.` },
        { status: 400 },
      );
    }

    if (typeof body.url !== "string" || body.url.trim().length === 0) {
      return NextResponse.json(
        { error: `${AUDIT_ROUTE_VERSION}: A valid URL is required.` },
        { status: 400 },
      );
    }

    let normalizedUrl: string;

    try {
      normalizedUrl = normalizeUrl(body.url);
    } catch {
      return NextResponse.json(
        { error: `${AUDIT_ROUTE_VERSION}: Invalid URL.` },
        { status: 400 },
      );
    }

    let normalizedCompetitorUrl: string | null = null;

    if (typeof body.competitorUrl === "string" && body.competitorUrl.trim().length > 0) {
      try {
        normalizedCompetitorUrl = normalizeUrl(body.competitorUrl);
      } catch {
        return NextResponse.json(
          { error: `${AUDIT_ROUTE_VERSION}: Invalid competitor URL.` },
          { status: 400 },
        );
      }
    }

    const ip = getClientIp(request);
    const resolvedUser = await resolveUser(request);

    if (!resolvedUser) {
      return NextResponse.json(
        { error: `${AUDIT_ROUTE_VERSION}: Unauthenticated.` },
        { status: 401 },
      );
    }

    try {
      await enforceRateLimit(ip, resolvedUser.token);
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        return NextResponse.json(
          { error: `${AUDIT_ROUTE_VERSION}: Daily request limit reached for this IP.` },
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
      const sitePages = await crawlSiteForInternalLinking(normalizedUrl, 72);
      const fullReport = findLinkOpportunities(sitePages, 48);
      const sourceOnlyReport = findLinkOpportunities(sitePages, 16, {
        sourceUrl: normalizedUrl,
      });
      const sourceOnlyKeys = new Set(
        sourceOnlyReport.opportunities.map(
          (entry) =>
            `${entry.sourceUrl}|${entry.targetUrl}|${(entry.suggestedAnchor ?? entry.rewriteSuggestion ?? "rewrite").toLowerCase()}`,
        ),
      );
      const mergedRaw = [
        ...sourceOnlyReport.opportunities,
        ...fullReport.opportunities.filter(
          (entry) =>
            !sourceOnlyKeys.has(
              `${entry.sourceUrl}|${entry.targetUrl}|${(entry.suggestedAnchor ?? entry.rewriteSuggestion ?? "rewrite").toLowerCase()}`,
            ),
        ),
      ];
      const bestByAnchor = new Map<string, (typeof mergedRaw)[number]>();

      for (const entry of mergedRaw) {
        const anchorKey = (entry.suggestedAnchor ?? entry.rewriteSuggestion ?? "rewrite").toLowerCase();
        const existing = bestByAnchor.get(anchorKey);

        if (!existing || entry.confidenceScore > existing.confidenceScore) {
          bestByAnchor.set(anchorKey, entry);
        }
      }

      const merged = [...bestByAnchor.values()]
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 48);

      crawl.internalLinking = {
        ...fullReport,
        opportunities: merged,
      };
      console.debug("[audit-api][internal-linking][summary]", {
        sitePagesDiscovered: sitePages.length,
        opportunities: crawl.internalLinking.opportunities.length,
        scannedPageCount: crawl.internalLinking.scannedPageCount,
        diagnostics: crawl.internalLinking.diagnostics ?? null,
      });
    } catch (error) {
      console.error("[audit-api][internal-linking][error]", {
        message: getErrorMessage(error, "Internal linking generation failed."),
      });
      crawl.internalLinking = {
        pages: [],
        opportunities: [],
        scannedPageCount: 0,
        debug: [],
        diagnostics: {
          pagesInput: 0,
          pagesWithUsableContent: 0,
          internalLinksExtracted: 0,
          candidateSourcePages: 0,
          candidateDestinationPages: 0,
          contextsEvaluated: 0,
          pairEvaluations: 0,
          rawBodyAnchorMatchesFound: 0,
          rawAcceptedCandidates: 0,
          droppedByFilter: {
            contentLength: 0,
            samePage: 0,
            alreadyLinked: 0,
            canonicalTarget: 0,
            samePrimaryTopic: 0,
            notIndexable: 0,
            anchorMatchOrSimilarity: 0,
            fallbackAnchor: 0,
            shortAnchor: 0,
            lowScore: 0,
          },
          duplicateCandidatesRemoved: 0,
          removedByPerSourceCap: 0,
          removedByGlobalCap: 0,
          relatedCandidatesGenerated: 0,
          relatedSelected: 0,
          finalOpportunities: 0,
        },
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
    let competitorSnapshots: CompetitorSnapshot[] | undefined;
    let competitorStatus: "ok" | "failed" | "not_provided" = "not_provided";

    if (normalizedCompetitorUrl) {
      try {
        const competitorCrawl = await crawlPage(normalizedCompetitorUrl);
        const competitorScore = scoreAudit(competitorCrawl);
        competitorSnapshots = [
          {
            name:
              competitorCrawl.title.trim().length > 0
                ? competitorCrawl.title
                : new URL(competitorCrawl.url).hostname.replace(/^www\./, ""),
            url: competitorCrawl.url,
            score: competitorScore.total,
            titleLength: competitorCrawl.title.trim().length,
            h1: competitorCrawl.h1.trim().length > 0,
            wordCount: competitorCrawl.bodyText.split(/\s+/).filter(Boolean).length,
            internalLinks: competitorCrawl.internalLinkCount,
            schema: competitorCrawl.hasJsonLd,
          },
        ];
        competitorStatus = "ok";
      } catch (error) {
        competitorStatus = "failed";
        console.error("[audit-api][competitor][error]", {
          competitorUrl: normalizedCompetitorUrl,
          message: getErrorMessage(error, "Competitor crawl failed."),
        });
      }
    }

    let id: string;

    try {
      id = await createAuditRecord({
        userId: resolvedUser.id,
        accessToken: resolvedUser.token,
        url: normalizedUrl,
        crawl: {
          ...crawl,
          internalLinking: crawl.internalLinking
            ? {
                ...crawl.internalLinking,
                // Persist only the actionable output; debug/pages can become very large and time out inserts.
                pages: [],
                debug: [],
              }
            : undefined,
        },
        score,
        aiOutput,
        fixes,
        competitorSnapshots,
      });
    } catch (error) {
      const message = getErrorMessage(error, "Saving the audit failed.");
      console.error("[audit-api] AUDIT_WRITE_V3", {
        userId: resolvedUser.id,
        url: normalizedUrl,
        message,
      });
      throw new Error(`AUDIT_WRITE_V3: ${message}`);
    }

    return NextResponse.json({ id, competitorStatus });
  } catch (error) {
    const message = getErrorMessage(error, "Unexpected audit processing error.");
    console.error("[audit-api] AUDIT_API_V3", { message });

    return NextResponse.json(
      { error: `${AUDIT_ROUTE_VERSION}: ${message}` },
      { status: 500 },
    );
  }
}
