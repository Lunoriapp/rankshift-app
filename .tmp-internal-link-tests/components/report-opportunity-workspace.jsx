"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportOpportunityWorkspace = ReportOpportunityWorkspace;
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const image_alt_opportunity_cards_1 = require("@/components/image-alt-opportunity-cards");
const internal_link_opportunity_cards_1 = require("@/components/internal-link-opportunity-cards");
const supabase_browser_1 = require("@/lib/supabase-browser");
function ReportOpportunityWorkspace({ reportId, mode }) {
    var _a, _b, _c;
    const [payload, setPayload] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const load = async () => {
            var _a;
            try {
                const accessToken = await (0, supabase_browser_1.getSupabaseAccessToken)();
                const response = await fetch(`/api/reports/${reportId}`, {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                const nextPayload = (await response.json());
                if (!response.ok || !("audit" in nextPayload)) {
                    throw new Error((_a = nextPayload.error) !== null && _a !== void 0 ? _a : "Unable to load report.");
                }
                setPayload(nextPayload);
            }
            catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Unable to load report.");
            }
            finally {
                setIsLoading(false);
            }
        };
        void load();
    }, [reportId]);
    const imageSummary = (0, react_1.useMemo)(() => {
        var _a, _b, _c;
        if (!payload) {
            return null;
        }
        const images = (_a = payload.audit.crawl.images) !== null && _a !== void 0 ? _a : [];
        const altCounts = new Map();
        for (const image of images) {
            const alt = image.alt.trim().toLowerCase();
            if (!alt) {
                continue;
            }
            altCounts.set(alt, ((_b = altCounts.get(alt)) !== null && _b !== void 0 ? _b : 0) + 1);
        }
        let missing = 0;
        let weak = 0;
        let duplicate = 0;
        const weakPatterns = /^(image|photo|picture|graphic|logo|banner|img)$/i;
        for (const image of images) {
            const alt = image.alt.trim();
            if (!alt) {
                missing += 1;
                continue;
            }
            const normalized = alt.toLowerCase();
            if (((_c = altCounts.get(normalized)) !== null && _c !== void 0 ? _c : 0) > 1) {
                duplicate += 1;
                continue;
            }
            if (alt.length < 5 || weakPatterns.test(alt)) {
                weak += 1;
            }
        }
        return { missing, weak, duplicate, total: images.length };
    }, [payload]);
    if (isLoading) {
        return (<main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          Loading opportunities...
        </div>
      </main>);
    }
    if (error || !payload) {
        return (<main className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
          {error !== null && error !== void 0 ? error : "Unable to load opportunities."}
        </div>
      </main>);
    }
    const internalOpportunities = (_b = (_a = payload.audit.crawl.internalLinking) === null || _a === void 0 ? void 0 : _a.opportunities) !== null && _b !== void 0 ? _b : [];
    const imageOpportunities = (_c = payload.audit.crawl.images) !== null && _c !== void 0 ? _c : [];
    return (<main className="min-h-screen bg-[#f6f7fb] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px] rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] sm:p-8">
        <link_1.default href={`/report/${reportId}`} className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-800">
          &larr; Back to report
        </link_1.default>

        {mode === "internal-links" ? (<section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Internal linking</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">All internal link opportunities</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review every link opportunity and apply anchors where they improve relevance and crawl paths.
            </p>
            <internal_link_opportunity_cards_1.InternalLinkOpportunityCards opportunities={internalOpportunities}/>
          </section>) : null}

        {mode === "images" ? (<section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Image alt text</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">All image alt text fixes</h1>
            <p className="mt-2 text-sm text-slate-600">Review every image that needs clearer alt text.</p>
            {imageSummary ? (<div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Missing alt</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{imageSummary.missing}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Weak alt</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{imageSummary.weak}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Duplicate alt</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{imageSummary.duplicate}</p>
                </div>
              </div>) : null}
            <image_alt_opportunity_cards_1.ImageAltOpportunityCards images={imageOpportunities} pageUrl={payload.audit.url}/>
          </section>) : null}
      </div>
    </main>);
}
