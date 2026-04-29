"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseBrowserClient = getSupabaseBrowserClient;
exports.ensureSupabaseSession = ensureSupabaseSession;
exports.getSupabaseAccessToken = getSupabaseAccessToken;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase_config_1 = require("./supabase-config");
let browserClient = null;
function getSupabaseBrowserClient() {
    if (browserClient) {
        return browserClient;
    }
    const config = (0, supabase_config_1.getOptionalSupabasePublicConfig)();
    if (!config) {
        return null;
    }
    browserClient = (0, supabase_js_1.createClient)(config.url, config.anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
    return browserClient;
}
async function ensureSupabaseSession() {
    var _a;
    const client = getSupabaseBrowserClient();
    if (!client) {
        return null;
    }
    const { data: { session }, } = await client.auth.getSession();
    if (session) {
        return session;
    }
    const { data, error } = await client.auth.signInAnonymously();
    if (error) {
        throw new Error(error.message);
    }
    return (_a = data.session) !== null && _a !== void 0 ? _a : null;
}
async function getSupabaseAccessToken() {
    var _a;
    const session = await ensureSupabaseSession();
    return (_a = session === null || session === void 0 ? void 0 : session.access_token) !== null && _a !== void 0 ? _a : null;
}
