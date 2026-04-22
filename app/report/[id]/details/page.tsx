import { AuthBootstrap } from "@/components/auth-bootstrap";
import { ReportDestinationWorkspace } from "@/components/report-destination-workspace";

export const dynamic = "force-dynamic";

interface ReportDetailsPageProps {
  params: {
    id: string;
  };
}

export default function ReportDetailsPage({ params }: ReportDetailsPageProps) {
  return (
    <>
      <AuthBootstrap />
      <ReportDestinationWorkspace reportId={params.id} section="details" />
    </>
  );
}
