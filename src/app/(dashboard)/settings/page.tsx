import { ProjectBanner } from "@/components/dashboard/project-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { title: "Genel Ayarlar", desc: "Platform adı, logo ve görünürlük ayarları" },
          { title: "Ödeme Entegrasyonu", desc: "Stripe, iyzico ve fatura yapılandırması" },
          { title: "QR Ayarları", desc: "Varsayılan QR stili, domain ve yönlendirme" },
          { title: "Bildirimler", desc: "E-posta ve webhook bildirim tercihleri" },
        ].map((item) => (
          <Card key={item.title} className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                API entegrasyonu sonrası aktif olacak.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
