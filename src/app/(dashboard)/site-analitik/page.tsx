import { SiteAnalyticsPanel } from "@/components/algory/site-analytics-panel";
import { ProjectBanner } from "@/components/dashboard/project-banner";

export default function SiteAnalitikPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <SiteAnalyticsPanel />
    </div>
  );
}
