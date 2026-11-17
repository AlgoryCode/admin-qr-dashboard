"use client";

import { useState } from "react";
import { Loader2, LockKeyhole, QrCode } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function LoginPage() {
  const { login, loginWithMfa, isLoading } = useAuth();
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mfaToken) {
        await loginWithMfa(mfaToken, code.replace(/\s/g, ""));
      } else {
        const challenge = await login({ username: username.trim(), password });
        if (challenge) {
          setMfaToken(challenge.mfaToken);
          setPassword("");
        }
      }
    } catch (err) {
      if (
        mfaToken &&
        err instanceof Error &&
        /süre|expired|geçersiz/i.test(err.message)
      ) {
        setMfaToken(null);
      }
      setError(err instanceof Error ? err.message : "Giriş yapılamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Oturum kontrol ediliyor...
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-md">
      <div className="absolute -top-14 right-0">
        <ThemeToggle />
      </div>

      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
          <QrCode className="size-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Admin QR Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            qr-service yönetim paneline giriş yapın
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LockKeyhole className="size-4 text-muted-foreground" />
            Giriş
          </CardTitle>
          <CardDescription>
            {mfaToken
              ? "İki adımlı doğrulama açık. Kodu girerek girişi tamamla."
              : "Yönetici hesabınla giriş yap."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mfaToken ? (
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Doğrulama kodu</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={7}
                  placeholder="123456"
                  className="text-center font-mono text-lg tracking-[0.4em]"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/[^0-9 ]/g, ""))
                  }
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Doğrulama uygulamandaki (Google Authenticator, 1Password vb.)
                  6 haneli kodu gir.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı adı</Label>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="kullanici_adi"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : mfaToken ? (
                "Doğrula"
              ) : (
                "Giriş Yap"
              )}
            </Button>
            {mfaToken ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={submitting}
                onClick={() => {
                  setMfaToken(null);
                  setCode("");
                  setError(null);
                }}
              >
                Geri dön
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Yaptığın her değişiklik işlem geçmişine kaydedilir.
      </p>
    </div>
  );
}
