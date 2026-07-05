import { PackagesTable, ProductsTable } from "@/components/algory/data-tables";
import { UserUsageChart } from "@/components/algory/user-usage-chart";
import { AlgoryStatsCards } from "@/components/algory/stats-cards";
import { ProjectBanner } from "@/components/dashboard/project-banner";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <AlgoryStatsCards />
      <UserUsageChart />
    </div>
  );
}
