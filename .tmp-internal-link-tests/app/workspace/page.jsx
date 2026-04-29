"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = WorkspacePage;
const page_list_shell_1 = require("@/components/workspace/page-list-shell");
const mock_workspace_pages_1 = require("@/lib/mock-workspace-pages");
exports.metadata = {
    title: "Workspace Pages | Rankshift",
    description: "Multi-page workspace view for scanning SEO priorities and jumping into audits.",
};
function WorkspacePage() {
    return <page_list_shell_1.WorkspacePageListShell pages={mock_workspace_pages_1.mockWorkspacePages}/>;
}
