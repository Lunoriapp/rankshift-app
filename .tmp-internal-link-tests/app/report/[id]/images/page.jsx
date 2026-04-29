"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = ReportImagesPage;
const auth_bootstrap_1 = require("@/components/auth-bootstrap");
const report_opportunity_workspace_1 = require("@/components/report-opportunity-workspace");
exports.dynamic = "force-dynamic";
function ReportImagesPage({ params }) {
    return (<>
      <auth_bootstrap_1.AuthBootstrap />
      <report_opportunity_workspace_1.ReportOpportunityWorkspace reportId={params.id} mode="images"/>
    </>);
}
