"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequiredEnv = getRequiredEnv;
exports.getSupabasePublicConfig = getSupabasePublicConfig;
exports.getOptionalSupabasePublicConfig = getOptionalSupabasePublicConfig;
exports.getSupabaseServerConfig = getSupabaseServerConfig;
function getRequiredEnv(name) {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value) {
        throw new Error(`${name} is not configured.`);
    }
    return value;
}
function getSupabasePublicConfig() {
    return {
        url: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
        anonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    };
}
function getOptionalSupabasePublicConfig() {
    var _a, _b;
    const url = (_a = process.env.NEXT_PUBLIC_SUPABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
    const anonKey = (_b = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) === null || _b === void 0 ? void 0 : _b.trim();
    if (!url || !anonKey) {
        return null;
    }
    return { url, anonKey };
}
function getSupabaseServerConfig() {
    var _a;
    const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    // Server-side privileged client must use the service-role key only.
    const key = (_a = process.env.SUPABASE_SERVICE_ROLE_KEY) === null || _a === void 0 ? void 0 : _a.trim();
    if (!key) {
        throw new Error("Supabase server key is not configured. Set SUPABASE_SERVICE_ROLE_KEY.");
    }
    return { url, key };
}
