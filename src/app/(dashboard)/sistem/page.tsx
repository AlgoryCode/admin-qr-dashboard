import { AiUsagePanel } from "@/components/algory/ai-usage-panel";
import { SuperAdminOnly } from "@/components/algory/super-admin-only";
import { SystemHealthPanel } from "@/components/algory/system-health-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SistemPage() {
  return (
    <SuperAdminOnly>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sistem</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Altyapının durumu, zamanlanmış işler ve yapay zekâ kullanımı.
          </p>
        </div>
        <Tabs defaultValue="health" className="gap-4">
          <TabsList>
            <TabsTrigger value="health">Durum</TabsTrigger>
            <TabsTrigger value="ai">Yapay zekâ kullanımı</TabsTrigger>
          </TabsList>
          <TabsContent value="health">
            <SystemHealthPanel />
          </TabsContent>
          <TabsContent value="ai">
            <AiUsagePanel />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminOnly>
  );
}
