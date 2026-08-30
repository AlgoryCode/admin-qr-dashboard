import { ProjectBanner } from "@/components/dashboard/project-banner";
import { PaymentsPanel } from "@/components/algory/payments-panel";

export default function OdemelerPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <PaymentsPanel />
    </div>
  );
}
