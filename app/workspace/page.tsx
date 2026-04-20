import type { Metadata } from "next";

import { WorkspacePageListShell } from "@/components/workspace/page-list-shell";
import { mockWorkspacePages } from "@/lib/mock-workspace-pages";

export const metadata: Metadata = {
  title: "Workspace Pages | Rankshift",
  description: "Multi-page workspace view for scanning SEO priorities and jumping into audits.",
};

export default function WorkspacePage() {
  return <WorkspacePageListShell pages={mockWorkspacePages} />;
}
