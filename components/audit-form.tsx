"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuditLoadingState } from "@/components/audit-loading-state";
import { getSupabaseAccessToken } from "@/lib/supabase-browser";
import { normalizeUrl } from "@/lib/utils/url";

interface AuditFormProps {
  buttonLabel?: string;
  className?: string;
  compact?: boolean;
}

const MIN_LOADING_STATE_MS = 6500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function AuditForm({
  buttonLabel = "Run Rankshift audit",
  className,
  compact = false,
}: AuditFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlur = () => {
    if (!url.trim()) {
      return;
    }

    try {
      const normalized = normalizeUrl(url);
      setUrl(normalized);
      setError(null);
    } catch {
      // Keep the current value so users can quickly fix input mistakes.
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    let hasNavigated = false;

    try {
      const normalizedUrl = normalizeUrl(url);
      setUrl(normalizedUrl);
      setIsSubmitting(true);
      const startedAt = Date.now();
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          url: normalizedUrl,
          competitorUrl: null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { id?: string; error?: string; competitorStatus?: "ok" | "failed" | "not_provided" }
        | null;

      if (!response.ok || !payload?.id) {
        throw new Error(payload?.error ?? "Unable to create audit.");
      }

      const elapsed = Date.now() - startedAt;
      const remaining = MIN_LOADING_STATE_MS - elapsed;

      if (remaining > 0) {
        await sleep(remaining);
      }

      const status =
        payload.competitorStatus === "failed"
          ? "failed"
          : payload.competitorStatus === "ok"
            ? "ok"
            : "not_provided";
      hasNavigated = true;
      router.replace(`/report/${payload.id}?competitorStatus=${status}`);
      return;
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create audit.",
      );
    } finally {
      if (!hasNavigated) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`${compact ? "mt-4" : "mt-8"} w-full max-w-2xl ${className ?? ""}`}
      noValidate
    >
      <div
        className={`flex w-full items-center overflow-hidden rounded-2xl border bg-white shadow-[0_12px_28px_-20px_rgba(67,56,202,0.55)] ${
          error ? "border-red-300" : "border-indigo-300"
        }`}
      >
        <label htmlFor="url" className="sr-only">
          Website to audit
        </label>
        <input
          id="url"
          type="text"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) {
              setError(null);
            }
          }}
          onBlur={handleBlur}
          placeholder="Enter your website (e.g. yourwebsite.com)"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "audit-url-error" : undefined}
          className={`${compact ? "h-12 text-sm" : "h-14"} w-full bg-white px-5 text-slate-900 outline-none placeholder:text-slate-400`}
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${compact ? "h-12 px-6" : "h-14 px-7"} shrink-0 bg-[linear-gradient(135deg,#4f46e5,#4338ca)] text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {isSubmitting ? "Running..." : buttonLabel}
        </button>
      </div>
      <div
        className={`${compact ? "mt-2 gap-x-4 text-xs" : "mt-3 gap-x-5 text-sm"} flex flex-wrap items-center gap-y-2 text-slate-500`}
      >
        <span>No signup required</span>
        <span>Results in under 10 seconds</span>
        <span>Works on any website</span>
        <span>Built for modern search and AI</span>
      </div>
      {error ? (
        <p id="audit-url-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <AuditLoadingState isVisible={isSubmitting} />
    </form>
  );
}
