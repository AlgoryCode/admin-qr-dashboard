import { ReportsSection } from "@/components/algory/reports-section";
import { ProjectBanner } from "@/components/dashboard/project-banner";

export default function RaporlarPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <ReportsSection />
    </div>
  );
}
