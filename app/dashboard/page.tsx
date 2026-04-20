import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { mockWorkspaceDashboard } from "@/lib/mock-dashboard";

export const metadata: Metadata = {
  title: "Workspace Dashboard | Rankshift",
  description: "Workspace-level SEO dashboard shell with premium KPI cards and action panels.",
};

export default function DashboardPage() {
  return <DashboardShell data={mockWorkspaceDashboard} />;
}
