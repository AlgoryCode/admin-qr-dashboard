"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { listPayments, PAYMENTS_PAGE_SIZE } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import type { PaymentSummaryResponse } from "@/lib/api/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  return `${amount} ${currency ?? ""}`.trim();
}

function toStartOfDay(date: string) {
  return `${date}T00:00:00`;
}

function toEndOfDay(date: string) {
  return `${date}T23:59:59`;
}

type ListParams = {
  page: number;
  q?: string;
  status?: string;
  paymentType?: string;
  createdFrom?: string;
  createdTo?: string;
};

export function PaymentsPanel() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentType, setPaymentType] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [listParams, setListParams] = useState<ListParams>({ page: 0 });
  const [payments, setPayments] = useState<PaymentSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (params: ListParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listPayments({
        page: params.page,
        size: PAYMENTS_PAGE_SIZE,
        q: params.q,
        status: params.status,
        paymentType: params.paymentType,
        createdFrom: params.createdFrom,
        createdTo: params.createdTo,
      });
      setPayments(result.content);
      setPage(result.page);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setHasNext(result.hasNext);
    } catch (err) {
      setPayments([]);
      setTotalElements(0);
      setTotalPages(0);
      setHasNext(false);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ödemeler yüklenemedi.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(listParams);
  }, [listParams, fetchPayments]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setListParams({
      page: 0,
      q: query.trim() || undefined,
      status: status === "all" ? undefined : status,
      paymentType: paymentType === "all" ? undefined : paymentType,
      createdFrom: createdFrom ? toStartOfDay(createdFrom) : undefined,
      createdTo: createdTo ? toEndOfDay(createdTo) : undefined,
    });
  }

  function handleClear() {
    setQuery("");
    setStatus("all");
    setPaymentType("all");
    setCreatedFrom("");
    setCreatedTo("");
    setListParams({ page: 0 });
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader>
        <CardTitle className="text-base">Ödemeler</CardTitle>
        <CardDescription>
          Direct API ve checkout ödemeleri · sayfa başına {PAYMENTS_PAGE_SIZE} kayıt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <Label htmlFor="payment-q" className="sr-only">
                Ara
              </Label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="payment-q"
                type="search"
                placeholder="Conversation, e-posta, hesap veya payment ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="payment-status">Durum</Label>
                <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
                  <SelectTrigger id="payment-status" className="w-full">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="SUCCESS">Başarılı</SelectItem>
                    <SelectItem value="FAILURE">Başarısız</SelectItem>
                    <SelectItem value="INITIATED">Başlatıldı</SelectItem>
                    <SelectItem value="REFUNDED">İade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment-type">Tip</Label>
                <Select
                  value={paymentType}
                  onValueChange={(value) => setPaymentType(value ?? "all")}
                >
                  <SelectTrigger id="payment-type" className="w-full">
                    <SelectValue placeholder="Tip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="DIRECT">Direct API</SelectItem>
                    <SelectItem value="CHECKOUT_FORM">Checkout Form</SelectItem>
                    <SelectItem value="THREE_DS">3D Secure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="created-from">Başlangıç</Label>
                <Input
                  id="created-from"
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="created-to">Bitiş</Label>
                <Input
                  id="created-to"
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Aranıyor
                </>
              ) : (
                <>
                  <Search />
                  Filtrele
                </>
              )}
            </Button>
            <Button type="button" variant="outline" disabled={isLoading} onClick={handleClear}>
              Temizle
            </Button>
          </div>
        </form>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading ? <Skeleton className="h-48 w-full" /> : null}

        {!isLoading && payments.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">Ödeme kaydı bulunamadı.</p>
        )}

        {!isLoading && payments.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">Toplam {totalElements} ödeme</p>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Tarih</TableHead>
                  <TableHead>Alıcı</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Hata</TableHead>
                  <TableHead>Paket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const statusDisplay = getPaymentStatusDisplay(payment.status);
                  return (
                    <TableRow
                      key={payment.conversationId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/odemeler/${encodeURIComponent(payment.conversationId)}`)
                      }
                    >
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {payment.buyerName || payment.buyerEmail || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.buyerEmail && payment.buyerName ? payment.buyerEmail : null}
                          {payment.userId ? ` · #${payment.userId}` : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatMoney(payment.paidPrice ?? payment.price, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.paymentType
                          ? getPaymentTypeLabel(payment.paymentType)
                          : "—"}
                        {payment.paymentStyle
                          ? ` · ${formatPaymentFields(payment.paymentStyle)}`
                          : null}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs text-destructive">
                        {payment.errorMessage || payment.errorCode || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.packageName ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Sayfa {page + 1}
                {totalPages > 0 ? ` / ${totalPages}` : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || isLoading}
                  onClick={() =>
                    setListParams((current) => ({
                      ...current,
                      page: Math.max(current.page - 1, 0),
                    }))
                  }
                >
                  Önceki
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasNext || isLoading}
                  onClick={() =>
                    setListParams((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  Sonraki
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
