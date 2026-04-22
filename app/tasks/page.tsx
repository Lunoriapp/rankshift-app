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
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] sm:p-8">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#f8f9fd] p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
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
