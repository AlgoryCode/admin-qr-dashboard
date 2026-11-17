"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { listPayments, PAYMENTS_PAGE_SIZE } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import type { PaymentPageResponse } from "@/lib/api/types";
import { getPaymentTypeLabel } from "@/lib/labels/tr";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "./export-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FilterSelect,
  Pager,
  SearchField,
  SegmentTabs,
  type FilterOption,
} from "@/components/algory/list-toolbar";

type StatusValue = "ALL" | "SUCCESS" | "FAILURE" | "INITIATED" | "REFUNDED";
type TypeValue = "ALL" | "DIRECT" | "CHECKOUT_FORM" | "THREE_DS";

type Query = {
  status: StatusValue;
  paymentType: TypeValue;
  q: string;
  from: string;
  to: string;
  /** Quick range in days, when one of the presets set the dates. */
  range: number | null;
  page: number;
};

const INITIAL_QUERY: Query = {
  status: "ALL",
  paymentType: "ALL",
  q: "",
  from: "",
  to: "",
  range: null,
  page: 0,
};

const STATUS_META: Record<
  Exclude<StatusValue, "ALL">,
  { label: string; className: string; dot: string }
> = {
  SUCCESS: {
    label: "Başarılı",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  FAILURE: {
    label: "Başarısız",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  INITIATED: {
    label: "Başlatıldı",
    className: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  REFUNDED: {
    label: "İade edildi",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
};

const TYPE_OPTIONS: FilterOption<TypeValue>[] = [
  { value: "ALL", label: "Tümü" },
  { value: "CHECKOUT_FORM", label: "Ödeme formu" },
  { value: "DIRECT", label: "Kayıtlı kart" },
  { value: "THREE_DS", label: "3D Secure" },
];

const STYLE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Abonelik",
  ONE_TIME: "Tek seferlik",
};

/** Quick date ranges; values are day counts back from today. */
const RANGE_PRESETS = [
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
];

function isoDay(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "TRY",
    }).format(amount);
  } catch {
    return `${amount} ${currency ?? ""}`.trim();
  }
}

export function PaymentsPanel() {
  const router = useRouter();
  const [query, setQuery] = useState<Query>(INITIAL_QUERY);
  const [result, setResult] = useState<{
    for: Query | null;
    data: PaymentPageResponse | null;
    error: string | null;
  }>({ for: null, data: null, error: null });

  const isLoading = result.for !== query;
  const data = result.data;
  const error = isLoading ? null : result.error;

  useEffect(() => {
    let cancelled = false;
    listPayments({
      page: query.page,
      size: PAYMENTS_PAGE_SIZE,
      q: query.q || undefined,
      status: query.status === "ALL" ? undefined : query.status,
      paymentType: query.paymentType === "ALL" ? undefined : query.paymentType,
      createdFrom: query.from ? `${query.from}T00:00:00` : undefined,
      createdTo: query.to ? `${query.to}T23:59:59` : undefined,
    })
      .then((page) => {
        if (!cancelled) setResult({ for: query, data: page, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "Ödemeler yüklenemedi.";
        setResult({ for: query, data: null, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  function update(patch: Partial<Query>) {
    setQuery((current) => ({ ...current, page: 0, ...patch }));
  }

  const payments = data?.content ?? [];
  const filtersActive =
    query.q !== "" ||
    query.paymentType !== "ALL" ||
    query.from !== "" ||
    query.to !== "";

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="space-y-3 border-b border-border/60 p-3 sm:p-4">
        <SegmentTabs<StatusValue>
          ariaLabel="Ödeme sonucu"
          value={query.status}
          onChange={(status) => update({ status })}
          items={[
            { value: "ALL", label: "Tümü" },
            ...(Object.keys(STATUS_META) as Exclude<StatusValue, "ALL">[]).map(
              (key) => ({
                value: key,
                label: STATUS_META[key].label,
                tone: STATUS_META[key].dot,
              }),
            ),
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            value={query.q}
            onChange={(q) => update({ q })}
            placeholder="E-posta, hesap, conversation veya ödeme no"
            className="w-full sm:w-80"
          />
          <FilterSelect
            label="Tip"
            value={query.paymentType}
            defaultValue="ALL"
            options={TYPE_OPTIONS}
            onChange={(paymentType) => update({ paymentType })}
          />
          <div className="flex items-center gap-1 rounded-lg border border-input p-0.5">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                aria-pressed={query.range === preset.days}
                onClick={() =>
                  update(
                    query.range === preset.days
                      ? { from: "", to: "", range: null }
                      : {
                          from: isoDay(
                            new Date(Date.now() - preset.days * 86_400_000),
                          ),
                          to: "",
                          range: preset.days,
                        },
                  )
                }
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-colors",
                  query.range === preset.days
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              aria-label="Başlangıç tarihi"
              value={query.from}
              max={query.to || undefined}
              onChange={(e) => update({ from: e.target.value, range: null })}
              className={cn("h-8 w-[9.5rem]", query.from && "bg-muted/60")}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="date"
              aria-label="Bitiş tarihi"
              value={query.to}
              min={query.from || undefined}
              onChange={(e) => update({ to: e.target.value, range: null })}
              className={cn("h-8 w-[9.5rem]", query.to && "bg-muted/60")}
            />
          </div>
          {filtersActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() =>
                setQuery({ ...INITIAL_QUERY, status: query.status })
              }
            >
              <RotateCcw />
              Sıfırla
            </Button>
          ) : null}
          <div className="ml-auto">
            <ExportButton
              kind="payments"
              from={query.from || undefined}
              to={query.to || undefined}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4">Tarih</TableHead>
              <TableHead>Alıcı</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Sonuç</TableHead>
              <TableHead className="pr-4">Yöntem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && data && "opacity-50")}>
            {isLoading && !data
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j} className={j === 0 ? "pl-4" : ""}>
                        <Skeleton className="h-4 w-full max-w-28" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {!isLoading && !error && payments.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12 text-center">
                  <p className="text-sm font-medium">Ödeme yok</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Bu filtrelere uyan ödeme kaydı bulunamadı.
                  </p>
                </TableCell>
              </TableRow>
            ) : null}

            {payments.map((payment) => {
              const meta =
                STATUS_META[payment.status as Exclude<StatusValue, "ALL">];
              const refunded = (payment.refundedAmount ?? 0) > 0;
              return (
                <TableRow
                  key={payment.conversationId}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/odemeler/${encodeURIComponent(payment.conversationId)}`,
                    )
                  }
                >
                  <TableCell className="pl-4 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(payment.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <div className="truncate font-medium">
                      {payment.buyerName || payment.buyerEmail || "—"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {payment.buyerName && payment.buyerEmail
                        ? payment.buyerEmail
                        : null}
                      {payment.userId
                        ? `${payment.buyerName && payment.buyerEmail ? " · " : ""}#${payment.userId}`
                        : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate">{payment.packageName ?? "—"}</div>
                    {payment.paymentStyle ? (
                      <div className="text-xs text-muted-foreground">
                        {STYLE_LABELS[payment.paymentStyle] ??
                          payment.paymentStyle}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    <div className="font-medium">
                      {formatMoney(
                        payment.paidPrice ?? payment.price,
                        payment.currency,
                      )}
                    </div>
                    {refunded ? (
                      <div className="text-xs text-muted-foreground">
                        iade{" "}
                        {formatMoney(payment.refundedAmount, payment.currency)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <Badge
                      variant="outline"
                      className={meta?.className ?? "text-muted-foreground"}
                    >
                      {meta?.label ?? payment.status}
                    </Badge>
                    {payment.status === "FAILURE" &&
                    (payment.errorMessage || payment.errorCode) ? (
                      <div
                        className="mt-1 truncate text-xs text-destructive"
                        title={payment.errorMessage ?? payment.errorCode ?? ""}
                      >
                        {payment.errorMessage || payment.errorCode}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="pr-4 whitespace-nowrap text-muted-foreground">
                    {payment.paymentType
                      ? getPaymentTypeLabel(payment.paymentType)
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {data && data.totalElements > 0 ? (
        <Pager
          page={data.page}
          size={data.size}
          total={data.totalElements}
          hasNext={data.hasNext}
          disabled={isLoading}
          unit="ödeme"
          onPage={(page) => setQuery((c) => ({ ...c, page }))}
        />
      ) : null}
    </div>
  );
}
