import { PackagesTable, ProductsTable } from "@/components/algory/data-tables";
import { FeaturesVersionsPanel } from "@/components/algory/features-versions-panel";
import { PriceSchedulePanel } from "@/components/algory/price-schedule-panel";
import { ShowcasePanel } from "@/components/algory/showcase-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PaketlerPage() {
  return (
    <Tabs defaultValue="catalog" className="gap-5">
      <TabsList>
        <TabsTrigger value="catalog">Katalog</TabsTrigger>
        <TabsTrigger value="features">Özellikler ve sürümler</TabsTrigger>
        <TabsTrigger value="plans">Kampanya ve fiyat planı</TabsTrigger>
        <TabsTrigger value="showcase">Modül vitrini</TabsTrigger>
      </TabsList>
      <TabsContent value="catalog" className="space-y-8">
        <ProductsTable />
        <PackagesTable />
      </TabsContent>
      <TabsContent value="features">
        <FeaturesVersionsPanel />
      </TabsContent>
      <TabsContent value="plans">
        <PriceSchedulePanel />
      </TabsContent>
      <TabsContent value="showcase">
        <ShowcasePanel />
      </TabsContent>
    </Tabs>
  );
}
