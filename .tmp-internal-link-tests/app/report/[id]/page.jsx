"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamic = void 0;
exports.default = ReportPage;
const auth_bootstrap_1 = require("@/components/auth-bootstrap");
const report_workspace_1 = require("@/components/report-workspace");
exports.dynamic = "force-dynamic";
function ReportPage({ params }) {
    return (<>
      <auth_bootstrap_1.AuthBootstrap />
      <report_workspace_1.ReportWorkspace reportId={params.id}/>
    </>);
}
