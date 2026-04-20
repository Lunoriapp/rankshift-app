"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AuditDetailsAccordion } from "@/components/AuditDetailsAccordion";
import { AuditHeroSummary } from "@/components/AuditHeroSummary";
import { CompetitorGapSection } from "@/components/CompetitorGapSection";
import { FixList } from "@/components/fix-list";
import { HistoryPanel } from "@/components/history-panel";
import { ImprovementTracker } from "@/components/ImprovementTracker";
import { PremiumInsightsLock } from "@/components/PremiumInsightsLock";
import { RewritePanel } from "@/components/rewrite-panel";
import { ScoreCards, type ScoreCardItem } from "@/components/score-cards";
import { TopFixesPanel } from "@/components/TopFixesPanel";
import { UpgradeModal } from "@/components/upgrade-modal";
import type { AuditFix, FixSeverity } from "@/lib/audit-fixes";
import { buildOptimisationPlan } from "@/lib/audit-fixes";
import {
  competitorComparisonData,
  type CompetitorComparisonData,
} from "@/lib/competitor-comparison";
import type { InternalLinkOpportunity } from "@/lib/internalLinking/types";
import type { OpportunityAssessment, ScoreBreakdown, ScorePillar } from "@/lib/scorer";
import type { AuditFixStateRecord, AuditHistoryEntry, AuditRecord } from "@/lib/supabase";
import { getSupabaseAccessToken } from "@/lib/supabase-browser";

interface ReportWorkspaceProps {
  reportId: string;
}

interface ReportPayload {
  audit: AuditRecord;
  history: AuditHistoryEntry[];
  fixStates: AuditFixStateRecord[];
}

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

function getFailedChecks(pillar: ScorePillar) {
  return pillar.checks.filter((check) => !check.passed);
}

function summarizePillar(
  key: ScoreCardItem["key"],
  pillar: ScorePillar,
  score: ScoreBreakdown,
): Pick<ScoreCardItem, "reason" | "impact"> {
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

function pillarEntries(score: ScoreBreakdown): ScoreCardItem[] {
  const entries: Array<{ key: ScoreCardItem["key"]; value: ScorePillar }> = [
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

function fallbackOpportunity(score: ScoreBreakdown): OpportunityAssessment {
  const label: OpportunityAssessment["label"] =
    score.total >= 80
      ? "High Potential"
      : score.total >= 65
        ? "Strong"
        : score.total >= 45
          ? "Emerging"
          : "At Risk";

  return {
    score: score.total,
    projectedScore: score.total,
    uplift: 0,
    label,
    rationale:
      "Opportunity score unavailable for this report version. Run a fresh audit to unlock the full growth estimate.",
  };
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

function getWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildLiveCompetitorComparisonData(audit: AuditRecord): CompetitorComparisonData {
  return {
    user: {
      name: "Your Page",
      score: audit.score.total,
      titleLength: audit.crawl.title.trim().length,
      h1: audit.crawl.h1.trim().length > 0,
      wordCount: getWordCount(audit.crawl.bodyText),
      internalLinks: audit.crawl.internalLinkCount,
      schema: audit.crawl.hasJsonLd,
    },
    competitors: competitorComparisonData.competitors,
  };
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

export function ReportWorkspace({ reportId }: ReportWorkspaceProps) {
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDetailSections, setOpenDetailSections] = useState<string[]>([]);
  const [fixFeedbackMessage, setFixFeedbackMessage] = useState<string | null>(null);
  const topFixesRef = useRef<HTMLElement | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);

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

  const toggleDetailSection = (id: string) => {
    setOpenDetailSections((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const openDetailSection = (id: string) => {
    setOpenDetailSections((current) => (current.includes(id) ? current : [...current, id]));
  };

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

    setFixFeedbackMessage(
      completed
        ? feedbackMessage
        : "This fix has been moved back into the active workflow.",
    );
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
    await persistCompletionState(
      fix.id,
      fix.severity,
      completed,
      "This improves search visibility and page clarity.",
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
      "This strengthens internal discovery and topical support.",
    );
  };

  const handleLockedFeature = (feature: string) => {
    setLockedFeature(feature);
    setIsModalOpen(true);
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

  const opportunity = payload.audit.score.opportunity ?? fallbackOpportunity(payload.audit.score);
  const auditedPageUrl = normalizeOpportunityUrl(payload.audit.url);
  const internalLinkOpportunities =
    payload.audit.crawl.internalLinking?.opportunities.filter(
      (opportunity) => normalizeOpportunityUrl(opportunity.sourceUrl) === auditedPageUrl,
    ) ?? [];
  const totalFixCount = payload.audit.fixes.length + internalLinkOpportunities.length;
  const cards = pillarEntries(payload.audit.score);
  const plan = buildOptimisationPlan(payload.audit.fixes, payload.audit.ai_output);
  const topFixes = [...payload.audit.fixes]
    .sort(
      (left, right) =>
        getFixPriorityValue(left.severity) - getFixPriorityValue(right.severity),
    )
    .slice(0, 3);
  const competitorData = buildLiveCompetitorComparisonData(payload.audit);
  const averageCompetitorScore = Math.round(
    competitorData.competitors.reduce((sum, item) => sum + item.score, 0) /
      competitorData.competitors.length,
  );
  const competitorGap = Math.max(averageCompetitorScore - competitorData.user.score, 0);
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
    <main data-report-page className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-[92rem] flex-col gap-10">
        <AuditHeroSummary
          url={payload.audit.url}
          score={payload.audit.score.total}
          issuesFound={totalFixCount}
          competitorGap={competitorGap}
          onPrimaryAction={() => {
            openDetailSection("full-audit-details");
            window.setTimeout(() => scrollToSection(detailsRef.current), 30);
          }}
          onSecondaryAction={() => scrollToSection(topFixesRef.current)}
        />

        <section ref={topFixesRef}>
          <TopFixesPanel
            fixes={topFixes}
            remainingCount={Math.max(payload.audit.fixes.length - topFixes.length, 0)}
            onFixAction={() => {
              openDetailSection("full-audit-details");
              window.setTimeout(() => scrollToSection(detailsRef.current), 30);
            }}
            onViewAll={() => {
              openDetailSection("full-audit-details");
              window.setTimeout(() => scrollToSection(detailsRef.current), 30);
            }}
          />
        </section>

        <CompetitorGapSection data={competitorData} />

        <PremiumInsightsLock onUnlock={() => handleLockedFeature("Competitor insights")} />

        <ImprovementTracker
          completedActions={completedFixCount}
          scoreChange={latestHistoryEntry?.scoreDelta ?? null}
          remainingPriorityFixes={remainingPriorityFixes}
        />

        <section ref={detailsRef}>
          <AuditDetailsAccordion
            openSectionIds={openDetailSections}
            onToggleSection={toggleDetailSection}
            sections={[
              {
                id: "full-audit-details",
                title: "Full audit details",
                description:
                  "Open the full recommendation list, internal linking tasks, and implementation rewrites when you need the deeper work area.",
                content: (
                  <div className="space-y-8">
                    <FixList
                      fixes={payload.audit.fixes}
                      images={payload.audit.crawl.images}
                      internalLinkOpportunities={internalLinkOpportunities}
                      completedFixIds={completedFixIds}
                      onToggleFix={handleToggleFix}
                      onToggleOpportunity={handleToggleOpportunity}
                      feedbackMessage={fixFeedbackMessage}
                    />
                    <RewritePanel rewrites={rewrites} />
                  </div>
                ),
              },
              {
                id: "scoring-logic",
                title: "Scoring logic",
                description:
                  "See how each category is contributing to the score and where stronger optimisation signals can still lift the page.",
                content: <ScoreCards items={cards} />,
              },
              {
                id: "scan-history",
                title: "Scan history",
                description:
                  "Review previous scans, score movement, issue changes, and internal link gap changes over time.",
                content: (
                  <HistoryPanel
                    history={payload.history}
                    onLockedFeature={handleLockedFeature}
                  />
                ),
              },
              {
                id: "export-data",
                title: "Export data",
                description:
                  "Save the report or export the action plan when you need to share progress with a client or team.",
                content: (
                  <div className="rounded-[1.7rem] border border-slate-800 bg-slate-900 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleLockedFeature("Save report")}
                        className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Save report
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLockedFeature("Export data")}
                        className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                      >
                        Export data
                      </button>
                    </div>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                      Keep the main page focused on action. Open this only when you need to save or pass the audit on.
                    </p>
                    <div className="mt-6 rounded-[1.4rem] border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm leading-7 text-slate-300">
                      <span className="font-semibold text-white">Current implementation plan:</span>{" "}
                      {plan.steps.length} step{plan.steps.length === 1 ? "" : "s"} covering{" "}
                      {totalFixCount} tracked recommendation{totalFixCount === 1 ? "" : "s"}.
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </section>
      </div>
      <UpgradeModal
        isOpen={isModalOpen}
        feature={lockedFeature}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
}
