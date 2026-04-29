"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingPageShell = MarketingPageShell;
const marketing_site_header_1 = require("@/components/marketing-site-header");
function MarketingPageShell({ children }) {
    return (<main className="min-h-screen bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)]">
        <marketing_site_header_1.MarketingSiteHeader />
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </main>);
}
