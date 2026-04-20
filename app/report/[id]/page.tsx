import { AuthBootstrap } from "@/components/auth-bootstrap";
import { ReportWorkspace } from "@/components/report-workspace";

export const dynamic = "force-dynamic";

interface ReportPageProps {
  params: {
    id: string;
  };
}

export default function ReportPage({ params }: ReportPageProps) {
  return (
    <>
      <AuthBootstrap />
      <ReportWorkspace reportId={params.id} />
    </>
  );
}
