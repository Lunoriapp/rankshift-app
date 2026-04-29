"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = getClientIp;
exports.enforceRateLimit = enforceRateLimit;
const supabase_1 = require("./supabase");
const DAILY_LIMIT = 3;
const localRateLimitCounts = new Map();
function getClientIp(request) {
    var _a;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    if (forwardedFor) {
        return ((_a = forwardedFor.split(",")[0]) === null || _a === void 0 ? void 0 : _a.trim()) || "unknown";
    }
    if (realIp) {
        return realIp.trim();
    }
    return "unknown";
}
function getCurrentDateKey() {
    return new Date().toISOString().slice(0, 10);
}
function isPolicyBlocked(message) {
    const normalized = message.toLowerCase();
    return (normalized.includes("row-level security") ||
        normalized.includes("permission denied") ||
        normalized.includes("not allowed") ||
        normalized.includes("policy"));
}
function enforceLocalRateLimit(ip, date) {
    var _a;
    const key = `${date}:${ip}`;
    const count = (_a = localRateLimitCounts.get(key)) !== null && _a !== void 0 ? _a : 0;
    if (count >= DAILY_LIMIT) {
        throw new Error("RATE_LIMIT_EXCEEDED");
    }
    localRateLimitCounts.set(key, count + 1);
}
async function enforceRateLimit(ip, accessToken) {
    const supabase = (0, supabase_1.getSupabaseServerClient)(accessToken);
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
    if ((count !== null && count !== void 0 ? count : 0) >= DAILY_LIMIT) {
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
