import { AuthBootstrap } from "@/components/auth-bootstrap";
import { ReportDestinationWorkspace } from "@/components/report-destination-workspace";

export const dynamic = "force-dynamic";

interface ReportScoringPageProps {
  params: {
    id: string;
  };
}

export default function ReportScoringPage({ params }: ReportScoringPageProps) {
  return (
    <>
      <AuthBootstrap />
      <ReportDestinationWorkspace reportId={params.id} section="scoring" />
    </>
  );
}
