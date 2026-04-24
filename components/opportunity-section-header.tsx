import Link from "next/link";
import type { ReactNode } from "react";

interface OpportunitySectionHeaderProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  helperText: string;
  ctaLabel: string;
  ctaHref: string;
}

export function OpportunitySectionHeader({
  icon,
  eyebrow,
  title,
  helperText,
  ctaLabel,
  ctaHref,
}: OpportunitySectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200">
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{helperText}</p>
        </div>
      </div>
      <Link
        href={ctaHref}
        className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
      >
        {ctaLabel} &rarr;
      </Link>
    </div>
  );
}
