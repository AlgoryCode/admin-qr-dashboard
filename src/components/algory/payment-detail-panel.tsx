"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getPayment, refundPayment } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import type { PaymentDetailResponse } from "@/lib/api/types";
import {
  formatPaymentFields,
  getPaymentStatusDisplay,
  getPaymentTypeLabel,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  return `${amount} ${currency ?? ""}`.trim();
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function PaymentDetailPanel({ conversationId }: { conversationId: string }) {
  const [payment, setPayment] = useState<PaymentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPayment(conversationId);
      setPayment(data);
      if (data.remainingAmount != null) {
        setRefundAmount(String(data.remainingAmount));
      }
    } catch (err) {
      setPayment(null);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ödeme detayı yüklenemedi.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPayment(conversationId);
        if (!cancelled) {
          setPayment(data);
          if (data.remainingAmount != null) {
            setRefundAmount(String(data.remainingAmount));
          }
        }
      } catch (err) {
        if (cancelled) return;
        setPayment(null);
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Ödeme detayı yüklenemedi.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function handleRefund() {
    if (!payment) return;
    setIsRefunding(true);
    setRefundError(null);
    try {
      const parsed = refundAmount.trim() ? Number(refundAmount) : undefined;
      if (parsed != null && (Number.isNaN(parsed) || parsed <= 0)) {
        setRefundError("Geçerli bir tutar girin.");
        return;
      }
      await refundPayment(payment.conversationId, parsed != null ? { amount: parsed } : {});
      setRefundOpen(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setRefundError(err.message);
      } else if (err instanceof Error) {
        setRefundError(err.message);
      } else {
        setRefundError("İade başlatılamadı.");
      }
    } finally {
      setIsRefunding(false);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !payment) {
    return (
      <Card className="border-border/60 bg-card/50">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-destructive">{error ?? "Ödeme bulunamadı."}</p>
          <Button variant="outline" render={<Link href="/odemeler" />}>
            <ArrowLeft />
            Ödemelere dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusDisplay = getPaymentStatusDisplay(payment.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" render={<Link href="/odemeler" />}>
            <ArrowLeft />
            Geri
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {payment.buyerName || payment.buyerEmail || payment.conversationId}
            </h1>
            <p className="text-sm text-muted-foreground">
              {payment.conversationId}
            </p>
          </div>
        </div>
        {payment.refundEligible ? (
          <Button onClick={() => setRefundOpen(true)}>İade başlat</Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
        {payment.verificationOnly ? <Badge variant="outline">Kart doğrulama</Badge> : null}
        {payment.refundEligible ? <Badge variant="secondary">İade uygun</Badge> : null}
      </div>

      {(payment.errorCode || payment.errorMessage) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Hata bilgisi</CardTitle>
            <CardDescription>Ödeme başarısız olduğunda gateway hata detayı</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Hata kodu" value={payment.errorCode ?? "—"} />
            <DetailItem label="Hata mesajı" value={payment.errorMessage ?? "—"} />
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Ödeme detayı</CardTitle>
          <CardDescription>
            {payment.paymentType ? getPaymentTypeLabel(payment.paymentType) : "Ödeme"} ·{" "}
            {formatPaymentFields(payment.paymentStyle)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Ödenen"
            value={formatMoney(payment.paidPrice ?? payment.price, payment.currency)}
          />
          <DetailItem
            label="İade edilen"
            value={formatMoney(payment.refundedAmount, payment.currency)}
          />
          <DetailItem
            label="Kalan"
            value={formatMoney(payment.remainingAmount, payment.currency)}
          />
          <DetailItem label="Oluşturulma" value={formatDate(payment.createdAt)} />
          <DetailItem label="Güncelleme" value={formatDate(payment.updatedAt)} />
          <DetailItem label="Payment ID" value={payment.paymentId ?? "—"} />
          <DetailItem
            label="İşlem ID"
            value={payment.paymentTransactionId ?? "—"}
          />
          <DetailItem label="Basket ID" value={payment.basketId ?? "—"} />
          <DetailItem label="Servis" value={payment.serviceName ?? "—"} />
          <DetailItem label="Kaynak ref" value={payment.sourceReferenceId ?? "—"} />
          <DetailItem
            label="Abonelik"
            value={payment.subscriptionId ?? "—"}
          />
          <DetailItem
            label="Döngü"
            value={payment.billingCycleNumber ?? "—"}
          />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">İlgili kişi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Ad" value={payment.buyerName ?? "—"} />
          <DetailItem label="E-posta" value={payment.buyerEmail ?? "—"} />
          <DetailItem label="Hesap ID" value={payment.accountId ?? "—"} />
          <DetailItem
            label="Kullanıcı"
            value={
              payment.userId ? (
                <Link
                  href={`/kullanicilar/${payment.userId}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  #{payment.userId}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <DetailItem
            label="Satın alım"
            value={
              payment.purchaseId && payment.userId ? (
                <Link
                  href={`/kullanicilar/${payment.userId}/satinalimlar/${payment.purchaseId}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {payment.packageName ?? `#${payment.purchaseId}`}
                </Link>
              ) : (
                payment.packageName ?? "—"
              )
            }
          />
          <DetailItem label="Paket kodu" value={payment.packageCode ?? "—"} />
        </CardContent>
      </Card>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>İade başlat</DialogTitle>
            <DialogDescription>
              {payment.buyerName || payment.buyerEmail || payment.conversationId} için PayTR
              iadesi başlatılacak.
              {payment.purchaseId
                ? " Bağlı aktif abonelik varsa iptal edilir."
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Tutar ({payment.currency ?? "TRY"})</Label>
            <Input
              id="refund-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Kalan: {formatMoney(payment.remainingAmount, payment.currency)}
            </p>
            {refundError ? (
              <p className="text-sm text-destructive">{refundError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isRefunding}
              onClick={() => setRefundOpen(false)}
            >
              Vazgeç
            </Button>
            <Button type="button" disabled={isRefunding} onClick={handleRefund}>
              {isRefunding ? (
                <>
                  <Loader2 className="animate-spin" />
                  İşleniyor
                </>
              ) : (
                "İade et"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
