import { AuthBootstrap } from "@/components/auth-bootstrap";
import { ReportDestinationWorkspace } from "@/components/report-destination-workspace";

export const dynamic = "force-dynamic";

interface ReportExportPageProps {
  params: {
    id: string;
  };
}

export default function ReportExportPage({ params }: ReportExportPageProps) {
  return (
    <>
      <AuthBootstrap />
      <ReportDestinationWorkspace reportId={params.id} section="export" />
    </>
  );
}
