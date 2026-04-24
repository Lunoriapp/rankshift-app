import { AuthBootstrap } from "@/components/auth-bootstrap";
import { ReportOpportunityWorkspace } from "@/components/report-opportunity-workspace";

export const dynamic = "force-dynamic";

interface ReportImagesPageProps {
  params: {
    id: string;
  };
}

export default function ReportImagesPage({ params }: ReportImagesPageProps) {
  return (
    <>
      <AuthBootstrap />
      <ReportOpportunityWorkspace reportId={params.id} mode="images" />
    </>
  );
}
