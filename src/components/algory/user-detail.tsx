"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import { getUser, impersonateUser, extendUserTrial, updateUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import type { UserDetailResponse } from "@/lib/api/types";
import { openMemberImpersonation } from "@/lib/member-app";
import { UserCredentialsCard } from "@/components/algory/user-credentials-card";
import {
  getAuthProviderLabel,
  getPurchaseStatusDisplay,
  getUserRoleLabel,
} from "@/lib/labels/tr";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

function toFormState(user: UserDetailResponse): UserFormState {
  return {
    firstName: user.firstName,
    lastName: user.lastName ?? "",
    email: user.email,
    phone: user.phone ?? "",
  };
}

function StatItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

export function UserDetailPanel({ userId }: { userId: number }) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [form, setForm] = useState<UserFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState("15");
  const [isExtendingTrial, setIsExtendingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [trialSuccess, setTrialSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getUser(userId);
        if (!cancelled) {
          setUser(data);
          setForm(toFormState(data));
        }
      } catch (err) {
        if (cancelled) return;
        setUser(null);
        setForm(null);
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Kullanıcı detayı yüklenemedi.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isDirty =
    user && form
      ? form.firstName !== user.firstName ||
        form.lastName !== (user.lastName ?? "") ||
        form.email !== user.email ||
        form.phone !== (user.phone ?? "")
      : false;

  function handleReset() {
    if (!user) return;
    setForm(toFormState(user));
    setFormError(null);
    setSaveSuccess(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;

    setFormError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const updated = await updateUser(userId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      });
      setUser(updated);
      setForm(toFormState(updated));
      setSaveSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = err.errors ? Object.values(err.errors).join(", ") : "";
        setFormError(fieldErrors || err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Kullanıcı güncellenemedi.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImpersonate() {
    setImpersonateError(null);
    setIsImpersonating(true);

    try {
      const response = await impersonateUser(userId);
      openMemberImpersonation(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setImpersonateError(err.message);
      } else if (err instanceof Error) {
        setImpersonateError(err.message);
      } else {
        setImpersonateError("Üye girişi başlatılamadı.");
      }
    } finally {
      setIsImpersonating(false);
    }
  }

  async function handleExtendTrial(event: React.FormEvent) {
    event.preventDefault();
    setTrialError(null);
    setTrialSuccess(null);

    const days = Number.parseInt(trialDays, 10);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      setTrialError("Gün sayısı 1 ile 365 arasında olmalıdır.");
      return;
    }

    setIsExtendingTrial(true);
    try {
      const result = await extendUserTrial(userId, { days });
      const refreshed = await getUser(userId);
      setUser(refreshed);
      setForm(toFormState(refreshed));
      setTrialSuccess(
        `${result.packageName} denemesine ${result.daysAdded} gün eklendi. Yeni bitiş: ${formatDate(result.expiresAt)}`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setTrialError(err.message);
      } else if (err instanceof Error) {
        setTrialError(err.message);
      } else {
        setTrialError("Deneme süresi uzatılamadı.");
      }
    } finally {
      setIsExtendingTrial(false);
    }
  }

  const activeTrial = user?.purchases.find(
    (purchase) =>
      purchase.purchaseType === "TRIAL" &&
      purchase.status === "ACTIVE" &&
      purchase.expiresAt &&
      new Date(purchase.expiresAt) > new Date(),
  );

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (error || !user || !form) {
    return (
      <Card className="border-border/60 bg-card/50">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-destructive">{error ?? "Kullanıcı bulunamadı."}</p>
          <Button variant="outline" render={<Link href="/kullanicilar" />}>
            <ArrowLeft />
            Kullanıcı aramaya dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayName =
    user.displayName || `${user.firstName} ${user.lastName ?? ""}`.trim();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" render={<Link href="/kullanicilar" />}>
          <ArrowLeft />
          Geri
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{displayName}</h1>
          <p className="text-xs text-muted-foreground">
            #{user.id} · {user.email} · Kayıt {formatDateShort(user.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{getAuthProviderLabel(user.provider)}</Badge>
          <Badge variant="secondary">{getUserRoleLabel(user.role)}</Badge>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isImpersonating}
            onClick={handleImpersonate}
          >
            {isImpersonating ? (
              <>
                <Loader2 className="animate-spin" />
                Açılıyor
              </>
            ) : (
              <>
                <LogIn />
                Üye olarak giriş
              </>
            )}
          </Button>
        </div>
      </div>

      {impersonateError && (
        <p className="text-sm text-destructive">{impersonateError}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start">
        <Card className="border-border/60 bg-card/50 lg:sticky lg:top-[4.5rem]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profil Düzenle</CardTitle>
            <CardDescription>Kullanıcı bilgilerini güncelleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-1.5">
                  <Label htmlFor="user-firstName">Ad</Label>
                  <Input
                    id="user-firstName"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user-lastName">Soyad</Label>
                  <Input
                    id="user-lastName"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-email">E-posta</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="off"
                    disabled={user.provider !== "BASIC"}
                  />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-phone">Telefon</Label>
                <Input
                  id="user-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Opsiyonel"
                  autoComplete="off"
                />
              </div>

              <Separator />

              <div className="grid gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <span>Rol</span>
                  <span className="text-foreground">{getUserRoleLabel(user.role)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Provider</span>
                  <span className="text-foreground">{getAuthProviderLabel(user.provider)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Son güncelleme</span>
                  <span className="text-foreground">{formatDateShort(user.updatedAt)}</span>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              {saveSuccess && !formError && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Değişiklikler kaydedildi.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={isSaving || !isDirty}>
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Kaydediliyor
                    </>
                  ) : (
                    "Kaydet"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving || !isDirty}
                  onClick={handleReset}
                >
                  Sıfırla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4 min-w-0">
          <UserCredentialsCard
            user={user}
            onUserUpdated={(updated) => {
              setUser(updated);
              setForm(toFormState(updated));
            }}
          />
          <Card className="border-border/60 bg-card/50">
            <CardContent className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
              <StatItem label="QR Sayısı" value={user.qrCount} />
              <StatItem label="Aktif Menü" value={user.activeMenuCount} />
              <StatItem label="Aktif Paket" value={user.activePackage ?? "—"} />
              <StatItem
                label="Deneme"
                value={
                  activeTrial
                    ? `Aktif (${formatDateShort(activeTrial.expiresAt)} bitiş)`
                    : user.trialExpiresAt
                      ? `Kullanıldı (${formatDateShort(user.trialExpiresAt)})`
                      : user.trialConsumed
                        ? "Evet"
                        : "Hayır"
                }
              />
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Deneme Yönetimi</CardTitle>
              <CardDescription className="text-xs">
                Ultimate deneme süresini uzatın veya yeni deneme başlatın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExtendTrial} className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="trial-days">Eklenecek gün</Label>
                  <Input
                    id="trial-days"
                    type="number"
                    min={1}
                    max={365}
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    className="w-28"
                  />
                </div>
                <Button type="submit" size="sm" disabled={isExtendingTrial}>
                  {isExtendingTrial ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Uygulanıyor
                    </>
                  ) : activeTrial ? (
                    "Süreyi uzat"
                  ) : (
                    "Deneme ver"
                  )}
                </Button>
              </form>
              {trialError && <p className="mt-3 text-sm text-destructive">{trialError}</p>}
              {trialSuccess && !trialError && (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{trialSuccess}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kayıt Bilgisi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pb-4 text-sm sm:grid-cols-3">
              <StatItem label="IP" value={user.registrationIpAddress ?? "—"} />
              <StatItem label="Cihaz" value={user.registrationDevice ?? "—"} />
              <StatItem label="Cihaz Tipi" value={user.registrationDeviceType ?? "—"} />
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium">Paket Geçmişi</CardTitle>
                <CardDescription className="text-xs">
                  {user.purchases.length} kayıt
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {user.purchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">Paket geçmişi yok.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12">ID</TableHead>
                        <TableHead>Paket</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="hidden md:table-cell">Satın Alma</TableHead>
                        <TableHead className="hidden lg:table-cell">Bitiş</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.purchases.map((purchase) => {
                        const status = getPurchaseStatusDisplay(purchase.status);
                        return (
                          <TableRow
                            key={purchase.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              router.push(
                                `/kullanicilar/${userId}/satinalimlar/${purchase.id}`
                              )
                            }
                          >
                            <TableCell>
                              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                                {purchase.id}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {purchase.packageName}
                                </p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {purchase.packageCode}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {purchase.price} {purchase.currency}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="text-[10px]">
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                              {formatDateShort(purchase.purchasedAt)}
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                              {formatDateShort(purchase.expiresAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
