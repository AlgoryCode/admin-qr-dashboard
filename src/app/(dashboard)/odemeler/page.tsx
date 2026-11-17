import { BillingAccountsPanel } from "@/components/algory/billing-accounts-panel";
import { PaymentsPanel } from "@/components/algory/payments-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OdemelerPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ödemeler</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Üyelerin ödeme durumu, yaklaşan tahsilatlar, borç takibi ve tek tek
          ödeme işlemleri.
        </p>
      </div>
      <Tabs defaultValue="accounts" className="gap-4">
        <TabsList>
          <TabsTrigger value="accounts">Üye ödeme durumu</TabsTrigger>
          <TabsTrigger value="transactions">Ödeme işlemleri</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">
          <BillingAccountsPanel />
        </TabsContent>
        <TabsContent value="transactions">
          <PaymentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
