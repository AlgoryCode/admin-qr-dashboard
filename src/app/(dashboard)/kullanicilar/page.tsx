import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectBanner } from "@/components/dashboard/project-banner";

export default function KullanicilarPage() {
  return (
    <div className="space-y-8">
      <ProjectBanner />
      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Kullanıcılar</CardTitle>
          <CardDescription>
            qr-service şu an admin kullanıcı listesi endpoint&apos;i sunmuyor.
            Kullanıcılar yalnızca kayıt (POST /auth/register) ile oluşturuluyor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bu özellik için qr-service tarafına{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /admin/users</code>{" "}
            endpoint&apos;i eklenebilir. Mevcut API&apos;de kullanıcı yönetimi auth
            üzerinden yapılıyor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
