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

interface InternalLinkOpportunityLike {
  sourceUrl: string;
  targetUrl: string;
  suggestedAnchor: string | null;
  rewriteSuggestion?: string | null;
  confidenceScore: number;
  matchedSnippet: string;
}

function jsonNoStore(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  return NextResponse.json(body, { ...init, headers });
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

function normalizeComparableUrl(value: string): string {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const pathname = (parsed.pathname.replace(/\/+$/, "") || "/").toLowerCase();
    return `${hostname}${pathname}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

function normalizeAnchorForDedupe(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function diceSimilarity(a: string, b: string): number {
  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  const grams = (text: string): Map<string, number> => {
    const map = new Map<string, number>();
    const source = text.length >= 2 ? text : `${text} `;
    for (let i = 0; i < source.length - 1; i += 1) {
      const gram = source.slice(i, i + 2);
      map.set(gram, (map.get(gram) ?? 0) + 1);
    }
    return map;
  };

  const aGrams = grams(a);
  const bGrams = grams(b);
  let intersection = 0;

  for (const [gram, count] of aGrams.entries()) {
    const bCount = bGrams.get(gram) ?? 0;
    intersection += Math.min(count, bCount);
  }

  const aCount = [...aGrams.values()].reduce((sum, count) => sum + count, 0);
  const bCount = [...bGrams.values()].reduce((sum, count) => sum + count, 0);
  if (aCount + bCount === 0) {
    return 0;
  }

  return (2 * intersection) / (aCount + bCount);
}

function sourceContainsAnchor(pageText: string, anchor: string): boolean {
  const normalizedPage = normalizeAnchorForDedupe(pageText);
  const normalizedAnchor = normalizeAnchorForDedupe(anchor);
  return normalizedAnchor.length > 0 && normalizedPage.includes(normalizedAnchor);
}

function enforceSourceScopedOpportunityQuality<T extends InternalLinkOpportunityLike>(
  opportunities: T[],
  analysedPageUrl: string,
  analysedPageText: string,
): T[] {
  const analysedComparable = normalizeComparableUrl(analysedPageUrl);

  const sourceValidated = opportunities.filter((entry) => {
    if (normalizeComparableUrl(entry.sourceUrl) !== analysedComparable) {
      return false;
    }

    if (!entry.matchedSnippet || normalizeAnchorForDedupe(entry.matchedSnippet).length === 0) {
      return false;
    }

    if (entry.suggestedAnchor) {
      return sourceContainsAnchor(analysedPageText, entry.suggestedAnchor);
    }

    return true;
  });

  const byExactKey = new Map<string, T>();
  for (const entry of sourceValidated) {
    const normalizedAnchor = normalizeAnchorForDedupe(
      entry.suggestedAnchor ?? entry.rewriteSuggestion ?? "rewrite",
    );
    const key = `${normalizedAnchor}|${normalizeComparableUrl(entry.targetUrl)}`;
    const existing = byExactKey.get(key);
    if (!existing || entry.confidenceScore > existing.confidenceScore) {
      byExactKey.set(key, entry);
    }
  }

  const exactDeduped = [...byExactKey.values()];
  const similarityDeduped: T[] = [];

  for (const entry of exactDeduped.sort((a, b) => b.confidenceScore - a.confidenceScore)) {
    const entryAnchor = normalizeAnchorForDedupe(entry.suggestedAnchor ?? "");
    const entryTarget = normalizeComparableUrl(entry.targetUrl);
    const similarExists = similarityDeduped.some((kept) => {
      const keptAnchor = normalizeAnchorForDedupe(kept.suggestedAnchor ?? "");
      const keptTarget = normalizeComparableUrl(kept.targetUrl);
      return keptTarget === entryTarget && diceSimilarity(keptAnchor, entryAnchor) >= 0.8;
    });

    if (!similarExists) {
      similarityDeduped.push(entry);
    }
  }

  return similarityDeduped;
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
      return jsonNoStore(
        { error: `${AUDIT_ROUTE_VERSION}: Invalid request body.` },
        { status: 400 },
      );
    }

    if (typeof body.url !== "string" || body.url.trim().length === 0) {
      return jsonNoStore(
        { error: `${AUDIT_ROUTE_VERSION}: A valid URL is required.` },
        { status: 400 },
      );
    }

    let normalizedUrl: string;

    try {
      normalizedUrl = normalizeUrl(body.url);
    } catch {
      return jsonNoStore(
        { error: `${AUDIT_ROUTE_VERSION}: Invalid URL.` },
        { status: 400 },
      );
    }

    let normalizedCompetitorUrl: string | null = null;

    if (typeof body.competitorUrl === "string" && body.competitorUrl.trim().length > 0) {
      try {
        normalizedCompetitorUrl = normalizeUrl(body.competitorUrl);
      } catch {
        return jsonNoStore(
          { error: `${AUDIT_ROUTE_VERSION}: Invalid competitor URL.` },
          { status: 400 },
        );
      }
    }

    const ip = getClientIp(request);
    const resolvedUser = await resolveUser(request);

    if (!resolvedUser) {
      return jsonNoStore(
        { error: `${AUDIT_ROUTE_VERSION}: Unauthenticated.` },
        { status: 401 },
      );
    }

    try {
      await enforceRateLimit(ip, resolvedUser.token);
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED") {
        return jsonNoStore(
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
      const sourceScoped = enforceSourceScopedOpportunityQuality(
        sourceOnlyReport.opportunities,
        normalizedUrl,
        crawl.bodyText,
      );
      const merged = [...sourceScoped]
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 48);

      const internalLinking = {
        ...fullReport,
        opportunities: merged,
      };
      crawl.internalLinking = internalLinking;
      console.debug("[audit-api][internal-linking][summary]", {
        sitePagesDiscovered: sitePages.length,
        opportunities: internalLinking.opportunities.length,
        scannedPageCount: internalLinking.scannedPageCount,
        diagnostics: internalLinking.diagnostics ?? null,
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

    return jsonNoStore({ id, competitorStatus });
  } catch (error) {
    const message = getErrorMessage(error, "Unexpected audit processing error.");
    console.error("[audit-api] AUDIT_API_V3", { message });

    return jsonNoStore(
      { error: `${AUDIT_ROUTE_VERSION}: ${message}` },
      { status: 500 },
    );
  }
}
