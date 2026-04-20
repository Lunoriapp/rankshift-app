import Link from "next/link";

import type { WorkspacePageListItem, WorkspacePagePriority } from "@/lib/workspace-page-list";
import {
  formatLastScannedDate,
  formatScoreDelta,
  getScoreDelta,
} from "@/lib/workspace-page-list";

interface WorkspacePageRowProps {
  page: WorkspacePageListItem;
}

function priorityStyles(priority: WorkspacePagePriority): {
  row: string;
  score: string;
  badge: string;
} {
  if (priority === "critical") {
    return {
      row: "border-red-200 bg-[linear-gradient(180deg,rgba(254,242,242,0.96),rgba(255,255,255,0.98))]",
      score: "text-red-700",
      badge: "bg-red-100 text-red-800 border-red-200",
    };
  }

  if (priority === "high") {
    return {
      row: "border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))]",
      score: "text-amber-700",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }

  if (priority === "medium") {
    return {
      row: "border-sky-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))]",
      score: "text-sky-700",
      badge: "bg-sky-100 text-sky-800 border-sky-200",
    };
  }

  return {
    row: "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.94),rgba(255,255,255,0.98))]",
    score: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
}

function deltaTone(delta: number | null): string {
  if (delta === null || delta === 0) {
    return "text-slate-500";
  }

  return delta > 0 ? "text-emerald-700" : "text-red-700";
}

function prettyPriority(priority: WorkspacePagePriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function WorkspacePageRow({ page }: WorkspacePageRowProps) {
  const delta = getScoreDelta(page.score, page.previousScore);
  const tones = priorityStyles(page.priority);

  return (
    <Link
      href={`/report/${page.id}`}
      className={`group block rounded-[28px] border px-5 py-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)] ${tones.row}`}
    >
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tones.badge}`}
            >
              {prettyPriority(page.priority)}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {page.issueCount} issues
            </span>
          </div>

          <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950 transition group-hover:text-slate-700 sm:text-xl">
            {page.title}
          </h2>
          <p className="mt-2 truncate text-sm text-slate-500">{page.url}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-[0.85fr_0.9fr_0.9fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Score
            </p>
            <div className="mt-2 flex items-end gap-3">
              <span className={`text-4xl font-semibold tracking-tight ${tones.score}`}>
                {page.score}
              </span>
              <span className={`pb-1 text-sm font-semibold ${deltaTone(delta)}`}>
                {formatScoreDelta(delta)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Last scanned
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {formatLastScannedDate(page.lastScanned)}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Focus next
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {page.priority === "critical"
                ? "Immediate attention"
                : page.priority === "high"
                  ? "High-priority recovery"
                  : page.priority === "medium"
                    ? "Tune and improve"
                    : "Maintain momentum"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
