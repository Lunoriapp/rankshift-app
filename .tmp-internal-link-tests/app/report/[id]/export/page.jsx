"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = ReportExportPage;
const auth_bootstrap_1 = require("@/components/auth-bootstrap");
const report_destination_workspace_1 = require("@/components/report-destination-workspace");
exports.dynamic = "force-dynamic";
function ReportExportPage({ params }) {
    return (<>
      <auth_bootstrap_1.AuthBootstrap />
      <report_destination_workspace_1.ReportDestinationWorkspace reportId={params.id} section="export"/>
    </>);
}
