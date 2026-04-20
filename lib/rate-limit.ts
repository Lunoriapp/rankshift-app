import type { NextRequest } from "next/server";

import { getSupabaseServerClient } from "./supabase";

const DAILY_LIMIT = 3;

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function getCurrentDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function enforceRateLimit(ip: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const date = getCurrentDateKey();

  const { count, error: countError } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("date", date);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) >= DAILY_LIMIT) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  const { error: insertError } = await supabase.from("rate_limits").insert({
    ip,
    date,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}
