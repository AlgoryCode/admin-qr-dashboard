import { AnnouncementsPanel } from "@/components/algory/announcements-panel";
import { EmailTemplatesPanel } from "@/components/algory/email-templates-panel";
import { FaqPanel } from "@/components/algory/faq-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function IcerikPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">İçerik</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Üyelerin gördüğü duyurular, sık sorulan sorular ve otomatik
          e-postalar.
        </p>
      </div>
      <Tabs defaultValue="announcements" className="gap-4">
        <TabsList>
          <TabsTrigger value="announcements">Duyurular</TabsTrigger>
          <TabsTrigger value="faq">SSS</TabsTrigger>
          <TabsTrigger value="emails">E-posta şablonları</TabsTrigger>
        </TabsList>
        <TabsContent value="announcements">
          <AnnouncementsPanel />
        </TabsContent>
        <TabsContent value="faq">
          <FaqPanel />
        </TabsContent>
        <TabsContent value="emails">
          <EmailTemplatesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
