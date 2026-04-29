"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthBootstrap = AuthBootstrap;
const react_1 = require("react");
const supabase_browser_1 = require("@/lib/supabase-browser");
function AuthBootstrap() {
    (0, react_1.useEffect)(() => {
        void (0, supabase_browser_1.ensureSupabaseSession)().catch(() => {
            // Silent fallback keeps the app usable even if anon auth is not configured yet.
        });
    }, []);
    return null;
}
