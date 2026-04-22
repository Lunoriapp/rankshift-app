import { AuthBootstrap } from "@/components/auth-bootstrap";
import { ReportDestinationWorkspace } from "@/components/report-destination-workspace";

export const dynamic = "force-dynamic";

interface ReportHistoryPageProps {
  params: {
    id: string;
  };
}

export default function ReportHistoryPage({ params }: ReportHistoryPageProps) {
  return (
    <>
      <AuthBootstrap />
      <ReportDestinationWorkspace reportId={params.id} section="history" />
    </>
  );
}
