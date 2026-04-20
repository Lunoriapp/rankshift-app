"use client";

interface UpgradeModalProps {
  isOpen: boolean;
  feature: string | null;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, feature, onClose }: UpgradeModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-md rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-2xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Upgrade to unlock
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
          Ongoing SEO tracking and competitor insight
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {feature
            ? `"${feature}" is available on the upgraded workspace.`
            : "This feature is available on the upgraded workspace."}{" "}
          Upgrade to see whether your fixes are actually improving performance over time, understand why competitors are outranking you, and export action plans that are ready to share.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
          >
            Upgrade Workspace
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
