import type { Metadata } from "next";

import { TaskSystem } from "@/components/tasks/task-system";

export const metadata: Metadata = {
  title: "Tasks | Rankshift",
  description: "Actionable SEO task system with progress tracking and completion state.",
};

interface TasksPageProps {
  searchParams?: {
    workspaceId?: string;
    pageId?: string;
    auditId?: string;
  };
}

export default function TasksPage({ searchParams }: TasksPageProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(178,245,234,0.38),_transparent_30%),linear-gradient(180deg,_#f7f9fc_0%,_#eef4f2_100%)] px-5 py-8 text-slate-900 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(239,248,244,0.84))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Task system
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                SEO execution queue
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                A clean workspace for turning audit insights into concrete action. Pass
                `workspaceId`, `pageId`, and optionally `auditId` in the URL to load the
                Supabase-backed task queue for a real page.
              </p>
            </div>
          </div>
        </section>

        <TaskSystem
          workspaceId={searchParams?.workspaceId}
          pageId={searchParams?.pageId}
          auditId={searchParams?.auditId}
        />
      </div>
    </main>
  );
}
