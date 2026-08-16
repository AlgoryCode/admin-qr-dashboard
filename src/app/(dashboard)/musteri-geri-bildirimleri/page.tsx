import { ProjectBanner } from "@/components/dashboard/project-banner";
import { PlatformFeedbackPanel } from "@/components/algory/platform-feedback-panel";

export default function MusteriGeriBildirimleriPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <PlatformFeedbackPanel />
    </div>
  );
}
