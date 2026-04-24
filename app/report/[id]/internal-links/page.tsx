import { AuthBootstrap } from "@/components/auth-bootstrap";
import { ReportOpportunityWorkspace } from "@/components/report-opportunity-workspace";

export const dynamic = "force-dynamic";

interface ReportInternalLinksPageProps {
  params: {
    id: string;
  };
}

export default function ReportInternalLinksPage({ params }: ReportInternalLinksPageProps) {
  return (
    <>
      <AuthBootstrap />
      <ReportOpportunityWorkspace reportId={params.id} mode="internal-links" />
    </>
  );
}
