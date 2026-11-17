"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  Loader2,
  LogOut,
  Monitor,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import {
  changeOwnPassword,
  disableMfa,
  enableMfa,
  getMe,
  listMySessions,
  revokeMySession,
  startMfaSetup,
  type AdminSession,
  type MeResponse,
  type MfaSetup,
} from "@/lib/api/security";
import { ADMIN_ROLE_META } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";

function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SecuritySettings() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meError, setMeError] = useState<string | null>(null);

  const reloadMe = useCallback(() => {
    getMe()
      .then((data) => {
        setMe(data);
        setMeError(null);
      })
      .catch((err) => setMeError(errorText(err, "Hesap bilgisi alınamadı.")));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch((err) => {
        if (!cancelled) setMeError(errorText(err, "Hesap bilgisi alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Hesabım</CardTitle>
          <CardDescription>
            Bu panelde kim olarak işlem yaptığın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meError ? (
            <p className="text-sm text-destructive">{meError}</p>
          ) : !me ? (
            <Skeleton className="h-14 w-full" />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Ad</dt>
                <dd className="mt-0.5 font-medium">
                  {me.firstName} {me.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Kullanıcı adı</dt>
                <dd className="mt-0.5 font-mono">{me.username ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Rol</dt>
                <dd className="mt-0.5">
                  <Badge
                    variant="outline"
                    className={ADMIN_ROLE_META[me.role].className}
                  >
                    {ADMIN_ROLE_META[me.role].label}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Son giriş</dt>
                <dd className="mt-0.5">{formatDateTime(me.lastLoginAt)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <MfaCard me={me} onChanged={reloadMe} />
        <PasswordCard />
      </div>
      <SessionsCard />
    </div>
  );
}

function MfaCard({
  me,
  onChanged,
}: {
  me: MeResponse | null;
  onChanged: () => void;
}) {
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorText(err, "İşlem yapılamadı."));
    } finally {
      setBusy(false);
    }
  }

  const enabled = me?.mfaEnabled ?? false;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {enabled ? (
            <ShieldCheck className="size-4 text-emerald-600" />
          ) : (
            <ShieldOff className="size-4 text-muted-foreground" />
          )}
          İki adımlı doğrulama
        </CardTitle>
        <CardDescription>
          {enabled
            ? "Açık. Girişte şifreden sonra uygulamadaki kod istenir."
            : "Kapalı. Açınca şifren çalınsa bile hesabına girilemez."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!me ? (
          <Skeleton className="h-9 w-40" />
        ) : enabled ? (
          disabling ? (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await disableMfa(code.trim());
                  setCode("");
                  setDisabling(false);
                  onChanged();
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="mfa-off">Güncel kod</Label>
                <Input
                  id="mfa-off"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="w-32 font-mono tracking-widest"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button
                type="submit"
                variant="destructive"
                disabled={busy || code.length < 6}
              >
                {busy ? <Loader2 className="animate-spin" /> : null}
                Kapat
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDisabling(false)}
              >
                Vazgeç
              </Button>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setDisabling(true)}>
              Doğrulamayı kapat
            </Button>
          )
        ) : setup ? (
          <div className="space-y-3">
            <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
              <li>Doğrulama uygulamasıyla QR kodu okut.</li>
              <li>Uygulamanın gösterdiği 6 haneli kodu aşağıya yaz.</li>
            </ol>
            <div className="flex flex-wrap items-center gap-4">
              {setup.qrPngBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/png;base64,${setup.qrPngBase64}`}
                  alt="İki adımlı doğrulama QR kodu"
                  className="size-36 rounded-md border border-border/60 bg-white p-1"
                />
              ) : null}
              <div className="min-w-0 space-y-1 text-xs">
                <div className="text-muted-foreground">
                  QR okumuyorsa bu anahtarı elle gir:
                </div>
                <code className="block rounded bg-muted px-2 py-1 font-mono text-[11px] break-all">
                  {setup.secret}
                </code>
              </div>
            </div>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await enableMfa(code.trim());
                  setSetup(null);
                  setCode("");
                  onChanged();
                });
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="mfa-on">Kod</Label>
                <Input
                  id="mfa-on"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="w-32 font-mono tracking-widest"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button type="submit" disabled={busy || code.length < 6}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                Doğrula ve aç
              </Button>
            </form>
          </div>
        ) : (
          <Button
            onClick={() =>
              run(async () => {
                setSetup(await startMfaSetup());
              })
            }
            disabled={busy}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            Kurulumu başlat
          </Button>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const mismatch = repeat.length > 0 && next !== repeat;
  const tooShort = next.length > 0 && next.length < 10;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await changeOwnPassword(current, next);
      setCurrent("");
      setNext("");
      setRepeat("");
      setMessage({ ok: true, text: "Şifren değişti." });
    } catch (err) {
      setMessage({ ok: false, text: errorText(err, "Şifre değiştirilemedi.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4 text-muted-foreground" />
          Şifre
        </CardTitle>
        <CardDescription>En az 10 karakter.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pw-current">Mevcut şifre</Label>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pw-new">Yeni şifre</Label>
              <Input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                aria-invalid={tooShort}
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-repeat">Tekrar</Label>
              <Input
                id="pw-repeat"
                type="password"
                autoComplete="new-password"
                aria-invalid={mismatch}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
              />
            </div>
          </div>
          {tooShort ? (
            <p className="text-xs text-destructive">
              En az 10 karakter olmalı.
            </p>
          ) : null}
          {mismatch ? (
            <p className="text-xs text-destructive">Şifreler aynı değil.</p>
          ) : null}
          {message ? (
            <p
              className={
                message.ok
                  ? "text-sm text-emerald-600"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={busy || !current || next.length < 10 || next !== repeat}
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            Şifreyi değiştir
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SessionList({
  sessions,
  onRevoke,
  busyId,
}: {
  sessions: AdminSession[];
  onRevoke?: (id: string) => void;
  busyId?: string | null;
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">Oturum yok.</p>;
  }
  return (
    <ul className="divide-y divide-border/60">
      {sessions.map((s) => (
        <li key={s.id} className="flex items-center gap-3 py-2.5">
          <Monitor className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="truncate font-medium">
                {s.device || s.userAgent || "Bilinmeyen cihaz"}
              </span>
              {s.current ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                >
                  Bu oturum
                </Badge>
              ) : !s.active ? (
                <Badge variant="outline" className="text-muted-foreground">
                  Kapalı
                </Badge>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">
              {s.ipAddress ?? "IP yok"} · giriş {formatDateTime(s.loggedInAt)} ·
              son işlem {formatDateTime(s.lastActivityAt)}
            </div>
          </div>
          {onRevoke && s.active && !s.current ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busyId === s.id}
              onClick={() => onRevoke(s.id)}
            >
              {busyId === s.id ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LogOut />
              )}
              Kapat
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SessionsCard() {
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listMySessions()
      .then((data) => {
        if (!cancelled) {
          setSessions(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Oturumlar alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  async function revoke(id: string) {
    setBusyId(id);
    try {
      await revokeMySession(id);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(errorText(err, "Oturum kapatılamadı."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Oturumlarım</CardTitle>
        <CardDescription>
          Hesabının açık olduğu cihazlar. Tanımadığın bir oturum varsa kapat ve
          şifreni değiştir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="mb-2 text-sm text-destructive">{error}</p>
        ) : null}
        {!sessions && error ? null : !sessions ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <SessionList
            sessions={sessions
              .filter((s) => s.active)
              .concat(sessions.filter((s) => !s.active).slice(0, 5))}
            onRevoke={revoke}
            busyId={busyId}
          />
        )}
      </CardContent>
    </Card>
  );
}
