"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuditHeroSummary } from "@/components/AuditHeroSummary";
import { CompetitorGapSection } from "@/components/CompetitorGapSection";
import { ExploreMoreLinks } from "@/components/explore-more-links";
import { ImprovementTracker } from "@/components/ImprovementTracker";
import { InternalLinkingOpportunities } from "@/components/internal-linking-opportunities";
import { TopFixesPanel } from "@/components/TopFixesPanel";
import type { AuditFix, FixSeverity } from "@/lib/audit-fixes";
import {
  buildCompetitorComparisonDataFromAudit,
  type CompetitorComparisonData,
} from "@/lib/competitor-comparison";
import type { InternalLinkOpportunity } from "@/lib/internalLinking/types";
import type { ScoreBreakdown, ScorePillar } from "@/lib/scorer";
import type {
  AuditFixStateRecord,
  AuditHistoryEntry,
  AuditRecord,
  CompetitorSnapshotRecord,
} from "@/lib/supabase";
import { getSupabaseAccessToken } from "@/lib/supabase-browser";

interface ReportWorkspaceProps {
  reportId: string;
}

interface ReportPayload {
  audit: AuditRecord;
  history: AuditHistoryEntry[];
  fixStates: AuditFixStateRecord[];
  competitorSnapshots: CompetitorSnapshotRecord[];
}

type AuditStatus = "Strong" | "Competitive" | "Needs improvement" | "At risk";

function normalizeOpportunityUrl(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return value;
  }
}

function normalizeComparablePageKey(value: string): string {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = (parsed.pathname.replace(/\/+$/, "") || "/").toLowerCase();
    return `${hostname}${pathname}`;
  } catch {
    return value.trim().toLowerCase();
  }
}

function getFailedChecks(pillar: ScorePillar) {
  return pillar.checks.filter((check) => !check.passed);
}

function summarizePillar(
  key: string,
  pillar: ScorePillar,
  score: ScoreBreakdown,
): { reason: string; impact: string } {
  const failed = getFailedChecks(pillar);

  if (key === "Meta") {
    if (failed.length === 0) {
      return {
        reason: "Title and description are both inside strong snippet ranges.",
        impact: "Snippet quality is supporting click-through instead of reducing it.",
      };
    }

    return {
      reason: failed.map((check) => check.label).join(" and "),
      impact: "Metadata gaps are reducing click-through and weakening search intent.",
    };
  }

  if (key === "Headings") {
    if (failed.length === 0) {
      return {
        reason: "Heading hierarchy is clear and easy to interpret.",
        impact: "Structure is supporting relevance, scanability, and page focus.",
      };
    }

    return {
      reason: failed.map((check) => check.label).join(" and "),
      impact: "Heading gaps are limiting topic depth and structural clarity.",
    };
  }

  if (key === "Images") {
    return pillar.score === pillar.maxScore
      ? {
          reason: "Image metadata coverage is complete.",
          impact: "Accessibility and image relevance are both being supported.",
        }
      : {
          reason: "Some images are still missing descriptive alt text.",
          impact: "Missing alt text weakens accessibility and reduces image search relevance.",
        };
  }

  if (key === "Performance") {
    return pillar.score === pillar.maxScore
      ? {
          reason: "Load performance is landing in the top scoring band.",
          impact: "Page speed is protecting engagement before users hit the main content.",
        }
      : {
          reason: "Performance still has measurable headroom.",
          impact: "Performance friction is reducing page clarity and conversion confidence.",
        };
  }

  if (key === "Internal Linking") {
    return pillar.score === pillar.maxScore
      ? {
          reason: "Internal linking is well structured at this crawl depth.",
          impact: "Related pages are reinforcing this page clearly and supporting discovery.",
        }
      : score.pillars.internalLinking.checks[1]?.score === 10
        ? {
            reason: "No high-impact internal linking gaps were found at this crawl depth, but stronger support is still available.",
            impact: "Adding more contextual links would improve authority flow and topical support.",
          }
        : {
            reason: "This page mentions related topics but misses opportunities to link deeper into the site.",
            impact: "Closing these gaps strengthens topical relevance and user flow.",
          };
  }

  return pillar.score === pillar.maxScore
    ? {
        reason: "Structured data was detected correctly.",
        impact: "Schema is helping search engines understand the page with more confidence.",
      }
    : {
        reason: "No JSON-LD schema was detected on the page.",
        impact: "Missing schema is reducing machine-readable context and rich result opportunity.",
      };
}

function pillarEntries(score: ScoreBreakdown): Array<{ key: string; value: ScorePillar; reason: string; impact: string }> {
  const entries: Array<{ key: string; value: ScorePillar }> = [
    { key: "Meta", value: score.pillars.meta },
    { key: "Headings", value: score.pillars.headings },
    { key: "Images", value: score.pillars.images },
    { key: "Performance", value: score.pillars.performance },
    { key: "Schema", value: score.pillars.schema },
    { key: "Internal Linking", value: score.pillars.internalLinking },
  ];

  return entries.map(({ key, value }) => ({
    key,
    value,
    ...summarizePillar(key, value, score),
  }));
}

function getIntent(label: "Title" | "Meta Description" | "H1"): string {
  if (label === "Title") {
    return "Ranking and click-through";
  }

  if (label === "Meta Description") {
    return "Search snippet conversion";
  }

  return "On-page relevance and clarity";
}

function getTarget(label: "Title" | "Meta Description" | "H1"): string {
  if (label === "Title") {
    return "Ideal length: 10-60 characters";
  }

  if (label === "Meta Description") {
    return "Ideal length: 50-160 characters";
  }

  return "One clear page-defining H1";
}

function getWhy(
  label: "Title" | "Meta Description" | "H1",
  score: ScoreBreakdown,
): string {
  if (label === "Title") {
    return score.pillars.meta.score < 20
      ? "Sharper titles improve topical alignment and can materially raise click-through once the page is ranking."
      : "This preserves relevance while clarifying the commercial promise users see in search.";
  }

  if (label === "Meta Description") {
    return score.pillars.meta.score < 20
      ? "A stronger description helps turn visibility into traffic by explaining value before the visit."
      : "This keeps the existing message tight while making the snippet easier to choose over competing results.";
  }

  return score.pillars.headings.score < 20
    ? "A cleaner H1 makes the page purpose more obvious to both readers and search engines."
    : "This keeps the page topic anchored with a stronger primary heading.";
}

function getFixPriorityValue(severity: FixSeverity): number {
  if (severity === "critical") {
    return 0;
  }

  if (severity === "high") {
    return 1;
  }

  return 2;
}

function getFixImpactValue(fix: AuditFix): number {
  const title = fix.title.toLowerCase();

  if (title.includes("h1") || title.includes("title tag") || title.includes("meta")) {
    return 0;
  }

  if (title.includes("internal link") || title.includes("schema")) {
    return 1;
  }

  if (title.includes("heading") || title.includes("content")) {
    return 2;
  }

  return 3;
}

function getCredibleScore(inputScore: number, issuesFound: number, competitorGap: number): number {
  let score = inputScore;

  if (issuesFound > 0) {
    score = Math.min(score, 98);
  }

  if (competitorGap > 0) {
    score = Math.min(score, 96 - Math.min(6, Math.floor(competitorGap / 2)));
  }

  if (issuesFound >= 8) {
    score = Math.min(score, 74);
  } else if (issuesFound >= 5) {
    score = Math.min(score, 84);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function deriveAuditStatus(score: number, issuesFound: number, competitorGap: number): AuditStatus {
  if (score < 45 || issuesFound >= 10 || competitorGap >= 12) {
    return "At risk";
  }

  if (score < 68 || issuesFound >= 6 || competitorGap >= 6) {
    return "Needs improvement";
  }

  if (score >= 82 && competitorGap <= 1 && issuesFound <= 2) {
    return "Strong";
  }

  return "Competitive";
}

function buildHeroMessaging(status: AuditStatus): { headline: string; summary: string } {
  if (status === "At risk") {
    return {
      headline: "Your page is behind on key ranking signals",
      summary:
        "Fix these issues now to stop losing visibility to stronger pages and recover competitive ground.",
    };
  }

  if (status === "Needs improvement") {
    return {
      headline: "Fix these issues to close the gap with stronger pages",
      summary:
        "Your page has potential, but competitors are still ahead on structure, depth, and internal support.",
    };
  }

  if (status === "Competitive") {
    return {
      headline: "You are close, but competitors still lead on a few signals",
      summary:
        "Prioritise the top fixes now to convert this page from nearly competitive to reliably strong.",
    };
  }

  return {
    headline: "Strong foundation, with clear opportunities to protect rankings",
    summary:
      "Your page is performing well. Ship the next fixes to stay ahead as competitor pages continue to improve.",
  };
}

function ensureTopFixCoverage(input: {
  fixes: AuditFix[];
  titleLength: number;
  h1Present: boolean;
  headingCount: number;
  wordCount: number;
  internalLinks: number;
  schemaPresent: boolean;
  competitorGap: number;
}): AuditFix[] {
  const merged = [...input.fixes];
  const hasId = new Set(input.fixes.map((fix) => fix.id));

  if (!input.h1Present && !hasId.has("single-h1")) {
    merged.push({
      id: "fallback-single-h1",
      severity: "critical",
      pillar: "headings",
      title: "Use one clear H1 to define page intent",
      issue: "The page is missing a clear primary H1.",
      whyItMatters: "Weak heading hierarchy makes intent harder to interpret and lowers ranking clarity.",
      action: "Add one page-defining H1 and support it with clear H2 sections.",
    });
  }

  if ((input.titleLength < 20 || input.titleLength > 60) && !hasId.has("meta-title")) {
    merged.push({
      id: "fallback-title-length",
      severity: "critical",
      pillar: "meta",
      title: "Improve title length and focus",
      issue: `The current title length (${input.titleLength}) is outside strong ranking ranges.`,
      whyItMatters: "Title quality drives both relevance signals and click-through potential.",
      action: "Rewrite the title to a clear 20-60 character format with primary intent early.",
    });
  }

  if (input.internalLinks < 6 && !hasId.has("internal-links")) {
    merged.push({
      id: "fallback-internal-links",
      severity: "high",
      pillar: "internalLinking",
      title: "Add internal links to strengthen page authority",
      issue: `Only ${input.internalLinks} internal links were found.`,
      whyItMatters: "Weak internal support reduces authority flow and slows ranking gains.",
      action: "Add at least 3-6 contextual internal links from relevant pages.",
    });
  }

  if (!input.schemaPresent && !hasId.has("schema-jsonld")) {
    merged.push({
      id: "fallback-schema",
      severity: "high",
      pillar: "schema",
      title: "Add schema markup",
      issue: "Schema is missing on this page.",
      whyItMatters: "Structured data helps search engines understand page intent and entities.",
      action: "Implement JSON-LD schema matched to the page type.",
    });
  }

  if (input.wordCount < 900 && !hasId.has("fallback-content-depth")) {
    merged.push({
      id: "fallback-content-depth",
      severity: "high",
      pillar: "headings",
      title: "Expand content depth",
      issue: `Content depth is low (${input.wordCount} words) versus typical competing pages.`,
      whyItMatters: "Thin pages struggle to cover intent breadth and lose semantic depth.",
      action: `Add at least ${Math.max(350, 900 - input.wordCount)} words of useful, intent-matched content.`,
    });
  }

  if (input.headingCount < 4 && !hasId.has("heading-depth")) {
    merged.push({
      id: "fallback-heading-structure",
      severity: "high",
      pillar: "headings",
      title: "Improve heading structure",
      issue: "The page has too few structured headings.",
      whyItMatters: "Clear heading hierarchy improves scanability, relevance, and section-level targeting.",
      action: "Add meaningful H2 and H3 sections around services, proof, and user questions.",
    });
  }

  if (input.competitorGap >= 6 && !hasId.has("fallback-competitor-gap")) {
    merged.push({
      id: "fallback-competitor-gap",
      severity: "high",
      pillar: "internalLinking",
      title: "Close competitor execution gaps",
      issue: `Competing pages are ahead by ${input.competitorGap} points.`,
      whyItMatters: "Ranking gaps persist when competitors have stronger structural and topical execution.",
      action: "Ship the first three fixes this week, then rerun the audit to measure score lift.",
    });
  }

  return merged
    .sort((left, right) => {
      const severityDelta = getFixPriorityValue(left.severity) - getFixPriorityValue(right.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }

      return getFixImpactValue(left) - getFixImpactValue(right);
    })
    .slice(0, 3);
}

function estimateScoreLiftFromSeverity(severity: FixSeverity): number {
  if (severity === "critical") {
    return 4;
  }

  if (severity === "high") {
    return 3;
  }

  return 2;
}

function isKeywordAnchor(anchor: string): boolean {
  const normalized = anchor.trim().toLowerCase();

  if (!normalized || normalized === "related page link") {
    return false;
  }

  const genericAnchors = new Set([
    "click here",
    "learn more",
    "read more",
    "here",
    "more",
    "details",
    "this page",
    "this service",
  ]);

  if (genericAnchors.has(normalized)) {
    return false;
  }

  const hasLetters = /[a-z]/i.test(normalized);
  const hasKeywordShape = normalized.split(/\s+/).length >= 1 && normalized.length >= 4;

  return hasLetters && hasKeywordShape;
}

export function ReportWorkspace({ reportId }: ReportWorkspaceProps) {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fixFeedbackMessage, setFixFeedbackMessage] = useState<string | null>(null);
  const [scoreAdjustment, setScoreAdjustment] = useState(0);
  const topFixesRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const accessToken = await getSupabaseAccessToken();
        const response = await fetch(`/api/reports/${reportId}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const nextPayload = (await response.json()) as
          | (ReportPayload & { error?: string })
          | { error?: string };

        if (!response.ok || !("audit" in nextPayload)) {
          throw new Error(nextPayload.error ?? "Unable to load report.");
        }

        setPayload(nextPayload);
        setScoreAdjustment(0);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load report.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [reportId]);

  const completedFixIds = useMemo(
    () =>
      payload?.fixStates
        .filter((state) => state.completed)
        .map((state) => state.fix_id) ?? [],
    [payload],
  );

  const completedFixCount = completedFixIds.length;

  const scrollToSection = (element: HTMLElement | null) => {
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const persistCompletionState = async (
    fixId: string,
    severity: FixSeverity,
    completed: boolean,
    feedbackMessage: string,
  ) => {
    if (!payload) {
      return;
    }

    const accessToken = await getSupabaseAccessToken();
    const response = await fetch(`/api/reports/${payload.audit.id}/fixes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        fixId,
        severity,
        completed,
      }),
    });
    const result = (await response.json()) as
      | { state?: AuditFixStateRecord; error?: string }
      | null;

    if (!response.ok || !result?.state) {
      setError(result?.error ?? "Unable to update fix progress.");
      return;
    }

    const nextState = result.state;

    if (completed) {
      setFixFeedbackMessage(feedbackMessage);
      setScoreAdjustment((current) => Math.min(18, current + estimateScoreLiftFromSeverity(severity)));
    } else {
      setFixFeedbackMessage("This action has been moved back into the active workflow.");
      setScoreAdjustment((current) => Math.max(0, current - estimateScoreLiftFromSeverity(severity)));
    }
    window.setTimeout(() => setFixFeedbackMessage(null), 2400);

    setPayload((current) => {
      if (!current) {
        return current;
      }

      const remaining = current.fixStates.filter((state) => state.fix_id !== nextState.fix_id);
      return {
        ...current,
        fixStates: [...remaining, nextState],
      };
    });
  };

  const handleToggleFix = async (fix: AuditFix, completed: boolean) => {
    const currentScore = payload ? payload.audit.score.total + scoreAdjustment : 0;
    const projected = Math.min(100, currentScore + estimateScoreLiftFromSeverity(fix.severity));
    const feedbackMessage =
      fix.id === "internal-links" || fix.id === "fallback-internal-links"
        ? `2 internal links added. Score updated from ${currentScore} to ${projected}.`
        : fix.id === "meta-title" || fix.id === "fallback-title-length"
          ? `Title improved. Score updated from ${currentScore} to ${projected}.`
          : fix.id === "schema-jsonld" || fix.id === "fallback-schema"
            ? `Schema markup added. Score updated from ${currentScore} to ${projected}.`
            : `${fix.title} completed. Score updated from ${currentScore} to ${projected}.`;

    await persistCompletionState(
      fix.id,
      fix.severity,
      completed,
      feedbackMessage,
    );
  };

  const handleToggleOpportunity = async (
    opportunity: InternalLinkOpportunity,
    completed: boolean,
  ) => {
    const severity: FixSeverity =
      opportunity.confidence === "High" ? "high" : "medium";

    await persistCompletionState(
      opportunity.id,
      severity,
      completed,
      completed
        ? "2 internal links added. Score updated from your previous baseline."
        : "Internal link action moved back to pending.",
    );
  };

  if (isLoading) {
    return (
      <main data-report-page className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-400">
          Loading report workspace...
        </div>
      </main>
    );
  }

  if (error || !payload) {
    return (
      <main data-report-page className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm transition-colors duration-300 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error ?? "Unable to load report workspace."}
        </div>
      </main>
    );
  }

  const allInternalLinkOpportunities = payload.audit.crawl.internalLinking?.opportunities ?? [];
  const auditedPageKey = normalizeComparablePageKey(payload.audit.url);
  const sourceMatchedOpportunities = allInternalLinkOpportunities.filter(
    (opportunity) =>
      normalizeComparablePageKey(opportunity.sourceUrl) === auditedPageKey ||
      normalizeOpportunityUrl(opportunity.sourceUrl) === normalizeOpportunityUrl(payload.audit.url),
  );
  const internalLinkOpportunities =
    sourceMatchedOpportunities.length > 0
      ? sourceMatchedOpportunities
      : allInternalLinkOpportunities;
  const dedupedInternalLinkOpportunities = [...new Map(
    internalLinkOpportunities
      .filter((opportunity) => isKeywordAnchor(opportunity.suggestedAnchor))
      .map((opportunity) => [
        `${normalizeOpportunityUrl(opportunity.sourceUrl)}|${normalizeOpportunityUrl(opportunity.targetUrl)}|${opportunity.suggestedAnchor.toLowerCase()}`,
        opportunity,
      ]),
  ).values()];
  const focusedInternalLinkOpportunities = dedupedInternalLinkOpportunities.slice(0, 5);
  const totalFixCount = payload.audit.fixes.length + internalLinkOpportunities.length;
  const rawScore = (payload.audit.score_value ?? payload.audit.score.total) + scoreAdjustment;
  const competitorData: CompetitorComparisonData = buildCompetitorComparisonDataFromAudit(
    {
      score: rawScore,
      titleLength: payload.audit.title_length ?? payload.audit.crawl.title.trim().length,
      h1Present: payload.audit.h1_present ?? (payload.audit.crawl.h1.trim().length > 0),
      wordCount:
        payload.audit.word_count ??
        payload.audit.crawl.bodyText.split(/\s+/).filter(Boolean).length,
      internalLinks: payload.audit.internal_links ?? payload.audit.crawl.internalLinkCount,
      schemaPresent: payload.audit.schema_present ?? payload.audit.crawl.hasJsonLd,
      url: payload.audit.url,
    },
    payload.competitorSnapshots,
  );
  const hasCompetitorComparison = competitorData.competitors.length > 0;
  const averageCompetitorScore = hasCompetitorComparison
    ? Math.round(
        competitorData.competitors.reduce((sum, item) => sum + item.score, 0) /
          competitorData.competitors.length,
      )
    : competitorData.user.score;
  const competitorGap = Math.max(averageCompetitorScore - competitorData.user.score, 0);
  const credibleScore = getCredibleScore(rawScore, totalFixCount, competitorGap);
  const status = deriveAuditStatus(credibleScore, totalFixCount, competitorGap);
  const heroMessaging = buildHeroMessaging(status);
  const cards = pillarEntries(payload.audit.score);
  const topFixes = ensureTopFixCoverage({
    fixes: payload.audit.fixes,
    titleLength: competitorData.user.titleLength,
    h1Present: competitorData.user.h1,
    headingCount: payload.audit.crawl.headings.length,
    wordCount: competitorData.user.wordCount,
    internalLinks: competitorData.user.internalLinks,
    schemaPresent: competitorData.user.schema,
    competitorGap,
  });
  const competitorStatus = searchParams.get("competitorStatus");
  const isPaid = searchParams.get("plan") === "paid";
  const latestHistoryEntry = payload.history[0] ?? null;
  const remainingPriorityFixes = payload.audit.fixes.filter(
    (fix) =>
      !completedFixIds.includes(fix.id) &&
      (fix.severity === "critical" || fix.severity === "high"),
  ).length;
  const rewrites = [
    {
      label: "Title" as const,
      value: payload.audit.ai_output.rewrites.title,
      why: getWhy("Title", payload.audit.score),
      intent: `${getIntent("Title")} · ${payload.audit.ai_output.rewrites.title.trim().length} chars`,
      target: getTarget("Title"),
    },
    {
      label: "Meta Description" as const,
      value: payload.audit.ai_output.rewrites.description,
      why: getWhy("Meta Description", payload.audit.score),
      intent: `${getIntent("Meta Description")} · ${payload.audit.ai_output.rewrites.description.trim().length} chars`,
      target: getTarget("Meta Description"),
    },
    {
      label: "H1" as const,
      value: payload.audit.ai_output.rewrites.h1,
      why: getWhy("H1", payload.audit.score),
      intent: `${getIntent("H1")} · ${payload.audit.ai_output.rewrites.h1.trim().length} chars`,
      target: getTarget("H1"),
    },
  ];

  return (
    <main data-report-page className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-[92rem] flex-col gap-10">
        <AuditHeroSummary
          url={payload.audit.url}
          score={credibleScore}
          issuesFound={totalFixCount}
          competitorGap={competitorGap}
          status={status}
          headline={heroMessaging.headline}
          summary={heroMessaging.summary}
          onPrimaryAction={() => {
            scrollToSection(topFixesRef.current);
          }}
          onSecondaryAction={() => scrollToSection(topFixesRef.current)}
        />

        {competitorStatus === "failed" ? (
          <section className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            Your page audit completed, but the competitor page could not be analysed.
          </section>
        ) : null}

        <section ref={topFixesRef}>
          <TopFixesPanel
            fixes={topFixes}
            remainingCount={Math.max(totalFixCount - topFixes.length, 0)}
            onFixAction={() => {
              window.location.assign(`/report/${reportId}/details`);
            }}
            onViewAll={() => {
              window.location.assign(`/report/${reportId}/details`);
            }}
          />
        </section>

        <InternalLinkingOpportunities
          opportunities={focusedInternalLinkOpportunities}
          completedOpportunityIds={completedFixIds}
          onToggleOpportunity={handleToggleOpportunity}
          initialVisibleCount={5}
        />

        {hasCompetitorComparison ? (
          <CompetitorGapSection data={competitorData} />
        ) : (
          <section className="rounded-[1.7rem] border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Competitor comparison
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
              Add a competitor URL to compare your page against another page
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Run a comparison audit any time by adding a competitor page URL in the main audit form.
            </p>
          </section>
        )}

        <ImprovementTracker
          completedActions={completedFixCount}
          scoreChange={latestHistoryEntry?.scoreDelta ?? null}
          remainingPriorityFixes={remainingPriorityFixes}
        />

        <ExploreMoreLinks reportId={reportId} isPaid={isPaid} />
      </div>
    </main>
  );
}
