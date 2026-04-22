import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionCard } from "@/components/dashboard/section-card";
import type { WorkspaceDashboardData } from "@/lib/mock-dashboard";

interface DashboardShellProps {
  data: WorkspaceDashboardData;
}

function formatLastScanDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function scoreTone(score: number): "default" | "strong" | "warning" {
  if (score >= 75) {
    return "strong";
  }

  if (score < 60) {
    return "warning";
  }

  return "default";
}

export function DashboardShell({ data }: DashboardShellProps) {
  const { workspace, healthSummary, scoreDistribution, actionQueue, recentHighlights } = data;

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] sm:p-8">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#f8f9fd] p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Workspace overview
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {workspace.name}
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
                Root domain:{" "}
                <span className="font-medium text-slate-900">{workspace.rootDomain}</span>
              </p>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {healthSummary.priorityFocus}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Average score"
                  value={`${workspace.averageScore}`}
                  detail={healthSummary.scoreDelta}
                  tone={scoreTone(workspace.averageScore)}
                />
                <MetricCard
                  label="Pages needing attention"
                  value={`${workspace.pagesNeedingAttention}`}
                  detail="Pages currently below your target health threshold."
                  tone="warning"
                />
                <MetricCard
                  label="Outstanding tasks"
                  value={`${workspace.outstandingTasks}`}
                  detail="Recommended fixes still open across the latest audit set."
                />
                <MetricCard
                  label="Link opportunities"
                  value={`${workspace.internalLinkingOpportunities}`}
                  detail="Internal links worth adding to strengthen topical authority."
                  tone="strong"
                />
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200/70 bg-slate-950 p-6 text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
                Recommended next move
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight">
                {workspace.nextRecommendedAction}
              </p>
              <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-400">Last scan date</p>
                  <p className="mt-2 text-lg font-medium text-white">
                    {formatLastScanDate(workspace.lastScanDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Tracked pages</p>
                  <p className="mt-2 text-lg font-medium text-white">
                    {healthSummary.monitoredPages}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            eyebrow="Performance"
            title="Search health snapshot"
            description="A tight summary of where the workspace stands right now, with enough context to prioritize action without turning the dashboard into reporting clutter."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {scoreDistribution.map((item) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={`${item.value}`}
                  detail="Latest workspace-wide snapshot."
                  tone={item.tone === "strong" ? "strong" : item.tone === "warning" ? "warning" : "default"}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Highlights"
            title="Recent signals"
            description="A few compact callouts to show progress and where momentum should go next."
          >
            <div className="space-y-4">
              {recentHighlights.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[18px] border border-slate-200/70 bg-slate-50/80 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        {item.value}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.context}</p>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          eyebrow="Action queue"
          title="What the team should do next"
          description="A modular list component you can later hydrate from audits, tasks, or workflow rules without redesigning the shell."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {actionQueue.map((item) => (
              <article
                key={item.title}
                className="rounded-[20px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                    {item.title}
                  </h3>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    {item.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
