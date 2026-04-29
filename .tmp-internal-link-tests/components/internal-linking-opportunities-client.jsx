"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalLinkingOpportunitiesClient = InternalLinkingOpportunitiesClient;
const react_1 = require("react");
const internal_linking_opportunities_1 = require("@/components/internal-linking-opportunities");
const supabase_browser_1 = require("@/lib/supabase-browser");
const mock_internal_linking_1 = require("@/lib/mock-internal-linking");
function InternalLinkingOpportunitiesClient({ workspaceId, pageId, auditId, }) {
    const shouldUseDatabase = Boolean(workspaceId && pageId);
    const [opportunities, setOpportunities] = (0, react_1.useState)(() => shouldUseDatabase ? [] : mock_internal_linking_1.mockInternalLinkingOpportunities);
    const [error, setError] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(shouldUseDatabase);
    (0, react_1.useEffect)(() => {
        if (!shouldUseDatabase || !workspaceId || !pageId) {
            return;
        }
        const load = async () => {
            var _a;
            setIsLoading(true);
            setError(null);
            try {
                const accessToken = await (0, supabase_browser_1.getSupabaseAccessToken)();
                const query = auditId ? `?auditId=${encodeURIComponent(auditId)}` : "";
                const response = await fetch(`/api/workspaces/${workspaceId}/pages/${pageId}/internal-link-opportunities${query}`, {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                const payload = (await response.json());
                if (!response.ok || !(payload === null || payload === void 0 ? void 0 : payload.opportunities)) {
                    throw new Error((_a = payload === null || payload === void 0 ? void 0 : payload.error) !== null && _a !== void 0 ? _a : "Unable to load internal link opportunities.");
                }
                setOpportunities(payload.opportunities);
            }
            catch (loadError) {
                setError(loadError instanceof Error
                    ? loadError.message
                    : "Unable to load internal link opportunities.");
            }
            finally {
                setIsLoading(false);
            }
        };
        void load();
    }, [auditId, pageId, shouldUseDatabase, workspaceId]);
    const completedOpportunityIds = (0, react_1.useMemo)(() => opportunities
        .filter((opportunity) => opportunity.status === "completed")
        .map((opportunity) => opportunity.id), [opportunities]);
    async function handleToggleOpportunity(opportunity, completed) {
        var _a;
        if (!shouldUseDatabase) {
            setOpportunities((current) => current.map((item) => item.id === opportunity.id
                ? Object.assign(Object.assign({}, item), { status: completed ? "completed" : "open" }) : item));
            return;
        }
        try {
            const row = opportunities.find((item) => item.id === opportunity.id);
            if (!row) {
                return;
            }
            const accessToken = await (0, supabase_browser_1.getSupabaseAccessToken)();
            const response = await fetch(`/api/internal-link-opportunities/${row.id}`, {
                method: "PATCH",
                headers: Object.assign({ "Content-Type": "application/json" }, (accessToken ? { Authorization: `Bearer ${accessToken}` } : {})),
                body: JSON.stringify({ completed, pageId, auditId }),
            });
            const payload = (await response.json());
            if (!response.ok || !(payload === null || payload === void 0 ? void 0 : payload.opportunity)) {
                throw new Error((_a = payload === null || payload === void 0 ? void 0 : payload.error) !== null && _a !== void 0 ? _a : "Unable to update internal link opportunity.");
            }
            setOpportunities((current) => current.map((item) => item.id === opportunity.id ? payload.opportunity : item));
            setError(null);
        }
        catch (updateError) {
            setError(updateError instanceof Error
                ? updateError.message
                : "Unable to update internal link opportunity.");
        }
    }
    return (<div className="space-y-4">
      {isLoading ? (<div className="rounded-[28px] border border-slate-200 bg-white/85 px-5 py-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          Loading internal linking opportunities...
        </div>) : null}
      {error ? (<div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          {error}
        </div>) : null}
      <internal_linking_opportunities_1.InternalLinkingOpportunities opportunities={opportunities} completedOpportunityIds={completedOpportunityIds} onToggleOpportunity={handleToggleOpportunity}/>
    </div>);
}
