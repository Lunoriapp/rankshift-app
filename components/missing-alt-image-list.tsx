"use client";

import { useState } from "react";

import type { CrawlImage } from "@/lib/crawler";

interface MissingAltImageListProps {
  images: CrawlImage[];
}

function truncateUrl(url: string, maxLength = 68): string {
  if (url.length <= maxLength) {
    return url;
  }

  return `${url.slice(0, maxLength - 1)}…`;
}

export function MissingAltImageList({ images }: MissingAltImageListProps) {
  const [copiedSrc, setCopiedSrc] = useState<string | null>(null);

  const handleCopy = async (src: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedSrc(src);
      window.setTimeout(() => setCopiedSrc((current) => (current === src ? null : current)), 1800);
    } catch {
      setCopiedSrc(null);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-4">
      {images.map((image) => (
        <div
          key={image.src}
          className="flex flex-col gap-4 rounded-[1.25rem] bg-white/80 p-4 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.12)] transition-colors duration-300 dark:bg-slate-800/70 sm:flex-row sm:items-start"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition-colors duration-300 dark:bg-slate-800">
            <img
              src={image.src}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{image.fileName}</p>
            <a
              href={image.src}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-xs text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
              title={image.src}
            >
              {truncateUrl(image.src)}
            </a>
            <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-4 transition-colors duration-300 dark:bg-slate-700">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                Suggested alt text
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{image.suggestedAlt}</p>
            </div>
          </div>
          <div className="sm:pt-8">
            <button
              type="button"
              onClick={() => void handleCopy(image.src, image.suggestedAlt)}
              className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              {copiedSrc === image.src ? "Copied" : "Copy alt text"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
