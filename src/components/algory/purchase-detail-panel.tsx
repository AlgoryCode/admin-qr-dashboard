"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PauseCircle, PlusCircle } from "lucide-react";
import { deactivateSubscription, extendSubscription, getPurchaseSummary } from "@/lib/api/purchases";
import { ApiError } from "@/lib/api/client";
import type { PurchaseSummaryResponse } from "@/lib/api/types";
import {
  formatPaymentFields,
  formatSubscriptionDisplay,
  getInstallmentStatusDisplay,
  getPurchaseStatusDisplay,
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

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function PurchaseDetailPanel({
  userId,
  purchaseId,
}: {
  userId: number;
  purchaseId: number;
}) {
  const [summary, setSummary] = useState<PurchaseSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPurchaseSummary(purchaseId);
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (cancelled) return;
        setSummary(null);
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Satın alım detayı yüklenemedi.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [purchaseId]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !summary) {
    return (
      <Card className="border-border/60 bg-card/50">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-destructive">{error ?? "Satın alım bulunamadı."}</p>
          <Button variant="outline" render={<Link href={`/kullanicilar/${userId}`} />}>
            <ArrowLeft />
            Kullanıcıya dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  const purchaseStatus = getPurchaseStatusDisplay(summary.status);

  async function handleDeactivate() {
    if (!window.confirm("Bu paketin abonelik erişimi pasifleştirilsin mi?")) return;
    setIsActing(true);
    setActionMessage(null);
    try {
      await deactivateSubscription(purchaseId);
      setActionMessage("Paket pasifleştirildi.");
      setSummary(await getPurchaseSummary(purchaseId));
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Paket pasifleştirilemedi.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleExtend() {
    const value = window.prompt("Kaç gün uzatılsın?", "30");
    const days = Number(value);
    if (!Number.isInteger(days) || days < 1 || days > 3650) return;
    setIsActing(true);
    setActionMessage(null);
    try {
      await extendSubscription(purchaseId, days);
      setActionMessage(`Paket ${days} gün uzatıldı.`);
      setSummary(await getPurchaseSummary(purchaseId));
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Paket uzatılamadı.");
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" render={<Link href={`/kullanicilar/${userId}`} />}>
          <ArrowLeft />
          Geri
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{summary.packageName}</h1>
          <p className="text-sm text-muted-foreground">
            Satın alım #{summary.purchaseId} · {summary.packageCode}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={purchaseStatus.variant}>{purchaseStatus.label}</Badge>
        {summary.usable ? (
          <Badge variant="default">Kullanılabilir</Badge>
        ) : (
          <Badge variant="secondary">Kullanılamaz</Badge>
        )}
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Abonelik Yönetimi</CardTitle>
          <CardDescription>Bu kullanıcının paket erişimini ve vade tarihini yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="destructive" disabled={isActing || !summary.usable} onClick={() => void handleDeactivate()}>
            <PauseCircle />
            Paketi pasifleştir
          </Button>
          <Button variant="outline" disabled={isActing} onClick={() => void handleExtend()}>
            <PlusCircle />
            Vade uzat
          </Button>
          {actionMessage ? <p className="text-sm text-muted-foreground">{actionMessage}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Satın Alım Bilgisi</CardTitle>
          <CardDescription>
            API: GET /admin/purchases/{summary.purchaseId}/summary
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Tutar" value={`${summary.price} ${summary.currency}`} />
          <DetailItem label="Satın Alma" value={formatDate(summary.purchasedAt)} />
          <DetailItem label="Başlangıç" value={formatDate(summary.startsAt)} />
          <DetailItem label="Bitiş" value={formatDate(summary.expiresAt)} />
          <DetailItem
            label="Ödeme Tipi"
            value={formatPaymentFields(
              summary.paymentMode,
              summary.paymentStyle,
              summary.purchaseType
            )}
          />
          <DetailItem
            label="Abonelik"
            value={formatSubscriptionDisplay(
              summary.subscriptionStatus,
              summary.billingPeriod
            )}
          />
          <DetailItem
            label="Kart"
            value={
              summary.cardBrand || summary.cardLastFour
                ? `${summary.cardBrand ?? ""} •••• ${summary.cardLastFour ?? ""}`.trim()
                : "—"
            }
          />
          <DetailItem label="Payment ID" value={summary.paymentId ?? "—"} />
          <DetailItem
            label="İade"
            value={
              summary.refundEligible
                ? `Uygun (${summary.refundableAmount ?? 0} ${summary.currency})`
                : "Uygun değil"
            }
          />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Paket Ürünleri ve Kullanım</CardTitle>
          <CardDescription>
            Bu satın alıma bağlı ürün hakları ve tüketim durumu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ürün kaydı yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Ürün</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Toplam</TableHead>
                  <TableHead>Kullanılan</TableHead>
                  <TableHead>Kalan</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        {product.productCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      {product.unlimited ? "Sınırsız" : (product.totalQuantity ?? "—")}
                    </TableCell>
                    <TableCell>{product.usedQuantity ?? 0}</TableCell>
                    <TableCell>
                      {product.unlimited ? "—" : (product.remainingQuantity ?? "—")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.usable ? "default" : "secondary"}>
                        {product.usable ? "Aktif" : product.expired ? "Süresi doldu" : "Pasif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {summary.installments.length > 0 && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Taksit / Dönem Ödemeleri</CardTitle>
            <CardDescription>
              {summary.installmentCount ?? summary.installments.length} taksit kaydı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Vade</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.installments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell>
                      {installment.installmentNumber ?? "—"}
                      {installment.installmentCount
                        ? ` / ${installment.installmentCount}`
                        : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getInstallmentStatusDisplay(installment.status).variant}>
                        {getInstallmentStatusDisplay(installment.status).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {installment.amount != null
                        ? `${installment.amount} ${installment.currency ?? summary.currency}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(installment.dueAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(installment.startsAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(installment.expiresAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
