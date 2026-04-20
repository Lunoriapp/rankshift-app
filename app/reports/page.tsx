import Link from "next/link";

import { AuthBootstrap } from "@/components/auth-bootstrap";
import { SavedReportsView } from "@/components/saved-reports-view";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_36%,#eef4ff_100%)] px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-none dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <AuthBootstrap />
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_20px_60px_-32px_rgba(2,6,23,0.8)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                Saved Reports
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
                Your audit workspace
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-200">
                Re-open previous audits, compare score changes, and keep implementation momentum moving from one session to the next.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
            >
              Run New Audit
            </Link>
          </div>
        </section>

        <SavedReportsView />
      </div>
    </main>
  );
}
