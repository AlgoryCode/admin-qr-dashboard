import { SecuritySettings } from "@/components/algory/security-settings";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ayarlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hesabın, şifren, iki adımlı doğrulama ve açık oturumların.
        </p>
      </div>
      <SecuritySettings />
    </div>
  );
}
