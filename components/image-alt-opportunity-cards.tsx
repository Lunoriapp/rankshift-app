"use client";

import { useMemo, useState } from "react";

import type { CrawlImage } from "@/lib/crawler";
import { decodeHtmlEntities } from "@/lib/decode-html-entities";

interface ImageAltOpportunityCardsProps {
  images: CrawlImage[];
  pageUrl: string;
  maxItems?: number;
}

type AltIssueStatus = "Missing alt text" | "Weak alt text" | "Duplicate alt text";

interface ImageAltOpportunity {
  image: CrawlImage;
  status: AltIssueStatus;
}

function compactUrl(value: string): string {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${host}${path}` || host;
  } catch {
    return value;
  }
}

function truncateValue(value: string, max = 70): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}

function normalizedAltText(value: string): string {
  return value.trim().toLowerCase();
}

function classifyAltStatus(
  image: CrawlImage,
  duplicateAltLookup: Map<string, number>,
): AltIssueStatus | null {
  const alt = image.alt.trim();

  if (alt.length === 0) {
    return "Missing alt text";
  }

  const normalized = normalizedAltText(alt);
  if ((duplicateAltLookup.get(normalized) ?? 0) > 1) {
    return "Duplicate alt text";
  }

  const weakPatterns = /^(image|photo|picture|graphic|logo|banner|img)$/i;
  if (alt.length < 5 || weakPatterns.test(alt)) {
    return "Weak alt text";
  }

  return null;
}

function statusTone(status: AltIssueStatus): string {
  if (status === "Missing alt text") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "Duplicate alt text") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function ImageAltOpportunityCards({
  images,
  pageUrl,
  maxItems,
}: ImageAltOpportunityCardsProps) {
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const [fixedImages, setFixedImages] = useState<Record<string, boolean>>({});

  const opportunities = useMemo(() => {
    const altCounts = new Map<string, number>();

    for (const image of images) {
      const alt = normalizedAltText(image.alt);
      if (!alt) {
        continue;
      }
      altCounts.set(alt, (altCounts.get(alt) ?? 0) + 1);
    }

    const mapped: ImageAltOpportunity[] = images
      .map((image) => {
        const status = classifyAltStatus(image, altCounts);
        if (!status) {
          return null;
        }

        return {
          image,
          status,
        };
      })
      .filter((value): value is ImageAltOpportunity => Boolean(value));

    const rank = {
      "Missing alt text": 0,
      "Duplicate alt text": 1,
      "Weak alt text": 2,
    } satisfies Record<AltIssueStatus, number>;

    return mapped.sort((a, b) => rank[a.status] - rank[b.status]);
  }, [images]);

  const visible =
    typeof maxItems === "number" ? opportunities.slice(0, maxItems) : opportunities;

  const copyTextToClipboard = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = value;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "absolute";
        temporaryInput.style.left = "-9999px";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(temporaryInput);
        return copied;
      } catch {
        return false;
      }
    }
  };

  const setFeedbackWithReset = (id: string, message: string) => {
    setActionFeedback((previous) => ({ ...previous, [id]: message }));
    window.setTimeout(() => {
      setActionFeedback((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
    }, 1800);
  };

  const handleCopyAlt = async (id: string, text: string) => {
    const copied = await copyTextToClipboard(text);
    setFeedbackWithReset(id, copied ? "Alt text copied" : "Copy failed");
  };

  const handleMarkFixed = (id: string) => {
    setFixedImages((previous) => ({ ...previous, [id]: true }));
    setFeedbackWithReset(id, "Marked as fixed");
  };

  return (
    <div className="mt-5 grid gap-4">
      {visible.map(({ image, status }) => {
        const suggested =
          image.suggestedAlt.trim().length > 0
            ? decodeHtmlEntities(image.suggestedAlt)
            : "Add a short, descriptive alt text that explains the image accurately.";
        const id = image.src;

        return (
          <article key={id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Image alt text opportunity</p>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${statusTone(status)}`}
              >
                {status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[96px_1fr]">
              <div className="h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img src={image.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Image file</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{decodeHtmlEntities(image.fileName || "Image asset")}</p>
                  <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">{truncateValue(image.src)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Found on this page</p>
                  <p className="mt-1 text-sm text-slate-700">{compactUrl(pageUrl)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Current alt text</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-700">
                {image.alt.trim() || "None"}
              </p>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Suggested alt text</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-700">{suggested}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCopyAlt(id, suggested)}
                className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Copy alt text
              </button>
              <button
                type="button"
                onClick={() => handleMarkFixed(id)}
                disabled={fixedImages[id]}
                className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {fixedImages[id] ? "Marked as fixed" : "Mark as fixed"}
              </button>
              {actionFeedback[id] ? (
                <p className="text-xs font-semibold text-slate-600">{actionFeedback[id]}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
