import type { NextRequest } from "next/server";

import { getSupabaseServerClient } from "./supabase";

const DAILY_LIMIT = 3;
const localRateLimitCounts = new Map<string, number>();

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

function isPolicyBlocked(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("not allowed") ||
    normalized.includes("policy")
  );
}

function enforceLocalRateLimit(ip: string, date: string): void {
  const key = `${date}:${ip}`;
  const count = localRateLimitCounts.get(key) ?? 0;

  if (count >= DAILY_LIMIT) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  localRateLimitCounts.set(key, count + 1);
}

export async function enforceRateLimit(ip: string, accessToken?: string): Promise<void> {
  const supabase = getSupabaseServerClient(accessToken);
  const date = getCurrentDateKey();

  const { count, error: countError } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("date", date);

  if (countError) {
    if (isPolicyBlocked(countError.message)) {
      enforceLocalRateLimit(ip, date);
      return;
    }
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
    if (isPolicyBlocked(insertError.message)) {
      enforceLocalRateLimit(ip, date);
      return;
    }
    throw new Error(insertError.message);
  }
}
