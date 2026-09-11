import { ProjectBanner } from "@/components/dashboard/project-banner";
import { CouponsPanel } from "@/components/algory/coupons-panel";

export default function KuponlarPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <CouponsPanel />
    </div>
  );
}
