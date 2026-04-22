import { AuthBootstrap } from "@/components/auth-bootstrap";
import { ReportDestinationWorkspace } from "@/components/report-destination-workspace";

export const dynamic = "force-dynamic";

interface ReportInsightsPageProps {
  params: {
    id: string;
  };
}

export default function ReportInsightsPage({ params }: ReportInsightsPageProps) {
  return (
    <>
      <AuthBootstrap />
      <ReportDestinationWorkspace reportId={params.id} section="insights" />
    </>
  );
}
