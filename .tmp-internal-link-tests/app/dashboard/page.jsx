"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = DashboardPage;
const dashboard_shell_1 = require("@/components/dashboard/dashboard-shell");
const mock_dashboard_1 = require("@/lib/mock-dashboard");
exports.metadata = {
    title: "Workspace Dashboard | Rankshift",
    description: "Workspace-level SEO dashboard shell with premium KPI cards and action panels.",
};
function DashboardPage() {
    return <dashboard_shell_1.DashboardShell data={mock_dashboard_1.mockWorkspaceDashboard}/>;
}
