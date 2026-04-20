"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuditLoadingState } from "@/components/audit-loading-state";
import { getSupabaseAccessToken } from "@/lib/supabase-browser";

interface AuditFormProps {
  buttonLabel?: string;
  className?: string;
}

export function AuditForm({
  buttonLabel = "Run SEO Audit",
  className,
}: AuditFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ url }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { id?: number; error?: string }
        | null;

      if (!response.ok || !payload?.id) {
        throw new Error(payload?.error ?? "Unable to create audit.");
      }

      router.push(`/report/${payload.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to create audit.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-8 flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/95 ${className ?? ""}`}
    >
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="url">
        Website URL
      </label>
      <input
        id="url"
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://example.com"
        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      >
        {isSubmitting ? "Running audit..." : buttonLabel}
      </button>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <AuditLoadingState isVisible={isSubmitting} />
    </form>
  );
}
