"use client";

import { useEffect, useMemo, useState } from "react";

const AUDIT_STEPS = [
  { label: "Scanning page structure", startsAt: 0 },
  { label: "Checking metadata", startsAt: 1 },
  { label: "Reviewing headings", startsAt: 2 },
  { label: "Analysing images", startsAt: 3 },
  { label: "Measuring performance", startsAt: 4 },
  { label: "Looking for internal linking opportunities", startsAt: 5 },
  { label: "Generating rewrite suggestions", startsAt: 6 },
] as const;

interface AuditLoadingStateProps {
  isVisible: boolean;
}

export function AuditLoadingState({ isVisible }: AuditLoadingStateProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 250);

    return () => window.clearInterval(interval);
  }, [isVisible]);

  const activeStepIndex = useMemo(() => {
    let index = 0;

    for (const [stepIndex, step] of AUDIT_STEPS.entries()) {
      if (elapsedSeconds >= step.startsAt) {
        index = stepIndex;
      }
    }

    return index;
  }, [elapsedSeconds]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mt-5 w-full max-w-2xl rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)] transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_20px_60px_-36px_rgba(2,6,23,0.75)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Audit in progress
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            Running a full SEO audit across the page
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            We are moving through the audit steps now. The active stage will animate as the audit
            progresses.
          </p>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 py-4 text-left transition-colors duration-300 sm:min-w-[8.5rem] dark:border-slate-700 dark:bg-slate-950/80">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Elapsed
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {elapsedSeconds}s
          </p>
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full w-1/3 animate-[audit-progress_1.8s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#38bdf8_100%)] dark:bg-[linear-gradient(90deg,#38bdf8_0%,#a5f3fc_100%)]" />
      </div>

      <div className="mt-5 space-y-2">
        {AUDIT_STEPS.map((step, index) => {
          const isCompleted = index < activeStepIndex;
          const isActive = index === activeStepIndex;

          return (
            <div
              key={step.label}
              className={`flex items-center gap-3 rounded-[18px] px-3 py-3 transition ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100"
                  : isActive
                    ? "bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100"
                    : "bg-slate-50/80 text-slate-500 dark:bg-slate-950/70 dark:text-slate-400"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isCompleted
                    ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200"
                    : isActive
                      ? "border-sky-200 bg-white text-sky-700 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-200"
                      : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                }`}
              >
                {isCompleted ? "✓" : index + 1}
              </span>
              <span className={`text-sm font-medium ${isActive ? "animate-pulse" : ""}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
