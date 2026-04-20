import type { AuditFix } from "@/lib/audit-fixes";

interface TopFixesPanelProps {
  fixes: AuditFix[];
  remainingCount: number;
  onFixAction: (fix: AuditFix) => void;
  onViewAll: () => void;
}

function getImpactLabel(severity: AuditFix["severity"]): string {
  if (severity === "critical") {
    return "High impact";
  }

  if (severity === "high") {
    return "Strong lift";
  }

  return "Quick win";
}

function getActionLabel(fix: AuditFix): string {
  if (fix.pillar === "internalLinking") {
    return "Add links";
  }

  if (fix.pillar === "meta" || fix.pillar === "headings") {
    return "Generate fix";
  }

  return "Apply fix";
}

function accentClasses(severity: AuditFix["severity"]): string {
  if (severity === "critical") {
    return "border-red-500/30 bg-red-500/10";
  }

  if (severity === "high") {
    return "border-sky-500/30 bg-slate-900";
  }

  return "border-slate-700 bg-slate-900";
}

export function TopFixesPanel({
  fixes,
  remainingCount,
  onFixAction,
  onViewAll,
}: TopFixesPanelProps) {
  return (
    <section className="rounded-[1.9rem] border border-slate-800 bg-slate-900 p-6 shadow-[0_22px_60px_-34px_rgba(2,6,23,0.75)] sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Fix these first
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
            Fix these first
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            These are the fastest high-value changes. If you only act on a few items today, start here.
          </p>
        </div>
        <div className="rounded-[1.4rem] bg-slate-800 px-4 py-4 text-sm text-slate-300">
          <span className="font-semibold text-white">{fixes.length}</span> top actions selected
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {fixes.map((fix) => (
          <article
            key={fix.id}
            className={`rounded-[1.6rem] border p-5 ${accentClasses(fix.severity)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {getImpactLabel(fix.severity)}
                </p>
                <h3 className="mt-3 max-w-sm text-xl font-semibold tracking-[-0.03em] text-white">
                  {fix.title}
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Why it matters
                </p>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-200">{fix.whyItMatters}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Recommended action
                </p>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-300">{fix.action}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onFixAction(fix)}
              className="mt-6 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              {getActionLabel(fix)}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          {remainingCount > 0
            ? `${remainingCount} more recommendation${remainingCount === 1 ? "" : "s"} are hidden below until you need them.`
            : "All remaining detail is collapsed below so the page stays focused."}
        </p>
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-semibold text-sky-300 transition hover:text-sky-200"
        >
          View all recommendations
        </button>
      </div>
    </section>
  );
}
