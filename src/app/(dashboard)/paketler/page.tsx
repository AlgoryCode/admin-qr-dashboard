import { PackagesTable, ProductsTable } from "@/components/algory/data-tables";
import { ProjectBanner } from "@/components/dashboard/project-banner";

export default function PaketlerPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <ProductsTable />
      <PackagesTable />
    </div>
  );
}
