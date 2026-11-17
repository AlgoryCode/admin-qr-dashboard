import { InvoicesPanel } from "@/components/algory/invoices-panel";
import { RevenuePanel } from "@/components/algory/revenue-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GelirPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Gelir</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Yinelenen gelir, tahsilat, müşteri kaybı ve kesilen faturalar.
        </p>
      </div>
      <Tabs defaultValue="revenue" className="gap-4">
        <TabsList>
          <TabsTrigger value="revenue">Özet</TabsTrigger>
          <TabsTrigger value="invoices">Faturalar</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue">
          <RevenuePanel />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
