"use client";

import { useEffect } from "react";

import { ensureSupabaseSession } from "@/lib/supabase-browser";

export function AuthBootstrap() {
  useEffect(() => {
    void ensureSupabaseSession().catch(() => {
      // Silent fallback keeps the app usable even if anon auth is not configured yet.
    });
  }, []);

  return null;
}
