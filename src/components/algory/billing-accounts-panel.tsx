"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import {
  BILLING_PAGE_SIZE,
  listBillingAccounts,
  type CollectionFilter,
} from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";
import type {
  BillingAccountPage,
  BillingAccountRow,
  BillingAccountSort,
  BillingStanding,
} from "@/lib/api/types";
import {
  COLLECTION_STATUS_META,
  COLLECTION_STATUS_ORDER,
} from "@/lib/labels/collection";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "./export-button";
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
  CollectionDialog,
  CollectionStatusBadge,
} from "@/components/algory/collection-dialog";
import {
  FilterSelect,
  Pager,
  SearchField,
  SegmentTabs,
  type FilterOption,
} from "@/components/algory/list-toolbar";

type View = "ALL" | BillingStanding | "COLLECTION";
type CollectionValue = CollectionFilter | "ALL";
type StyleValue = "ALL" | "SUBSCRIPTION" | "ONE_TIME";

type Query = {
  view: View;
  collection: CollectionValue;
  q: string;
  paymentStyle: StyleValue;
  dueWithinDays: number;
  sort: BillingAccountSort;
  page: number;
};

const INITIAL_QUERY: Query = {
  view: "ALL",
  collection: "ALL",
  q: "",
  paymentStyle: "ALL",
  dueWithinDays: 7,
  sort: "DUE_ASC",
  page: 0,
};

const STANDING_META: Record<
  BillingStanding,
  { label: string; className: string; dot: string }
> = {
  OVERDUE: {
    label: "Borçlu",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  DUE_SOON: {
    label: "Ödemesi yaklaşıyor",
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  PAID: {
    label: "Güncel",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  LAPSED: {
    label: "Süresi doldu",
    className: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

const SUBSCRIPTION_NOTES: Record<string, string> = {
  PAST_DUE: "Çekim başarısız",
  GRACE_PERIOD: "Ek süre",
  SUSPENDED: "Askıda",
};

const PERIOD_LABELS: Record<string, string> = {
  MONTHLY: "Aylık",
  YEARLY: "Yıllık",
  ONE_TIME: "Tek sefer",
};

const COLLECTION_OPTIONS: FilterOption<CollectionValue>[] = [
  { value: "ALL", label: "Tümü" },
  { value: "OPEN", label: "Takipte" },
  { value: "NONE", label: "Takipte değil" },
  ...COLLECTION_STATUS_ORDER.filter(
    (key) => !COLLECTION_STATUS_META[key].closed,
  ).map((key) => ({ value: key, label: COLLECTION_STATUS_META[key].label })),
];

const STYLE_OPTIONS: FilterOption<StyleValue>[] = [
  { value: "ALL", label: "Tümü" },
  { value: "SUBSCRIPTION", label: "Abonelik" },
  { value: "ONE_TIME", label: "Tek seferlik" },
];

const WINDOW_OPTIONS: FilterOption<string>[] = [3, 7, 14, 30].map((d) => ({
  value: String(d),
  label: `${d} gün`,
}));

const SORT_OPTIONS: FilterOption<BillingAccountSort>[] = [
  { value: "DUE_ASC", label: "Vade yakın" },
  { value: "DUE_DESC", label: "Vade uzak" },
  { value: "AMOUNT_DESC", label: "Tutar yüksek" },
  { value: "LAST_PAID_DESC", label: "Son ödeme yeni" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
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

function dueText(days: number | null) {
  if (days == null) return null;
  if (days === 0) return "bugün";
  return days > 0 ? `${days} gün kaldı` : `${-days} gün gecikti`;
}

function paymentMethod(row: BillingAccountRow) {
  const kind = row.autoRenew
    ? "Otomatik"
    : row.cancelAtPeriodEnd
      ? "Dönem sonu iptal"
      : row.paymentStyle === "SUBSCRIPTION"
        ? "Abonelik"
        : "Tek seferlik";
  return row.cardLastFour ? `${kind} · •••• ${row.cardLastFour}` : kind;
}

function toParams(query: Query) {
  const standing =
    query.view === "ALL" || query.view === "COLLECTION"
      ? undefined
      : query.view;
  const collection: CollectionFilter | undefined =
    query.view === "COLLECTION"
      ? "OPEN"
      : query.collection === "ALL"
        ? undefined
        : query.collection;
  return {
    standing,
    collection,
    q: query.q || undefined,
    paymentStyle: query.paymentStyle === "ALL" ? undefined : query.paymentStyle,
    dueWithinDays: query.dueWithinDays,
    sort: query.sort,
    page: query.page,
    size: BILLING_PAGE_SIZE,
  };
}

export function BillingAccountsPanel() {
  const router = useRouter();
  const [query, setQuery] = useState<Query>(INITIAL_QUERY);
  const [collectionFor, setCollectionFor] = useState<BillingAccountRow | null>(
    null,
  );
  const [result, setResult] = useState<{
    for: Query | null;
    data: BillingAccountPage | null;
    error: string | null;
  }>({ for: null, data: null, error: null });

  const isLoading = result.for !== query;
  const data = result.data;
  const error = isLoading ? null : result.error;

  useEffect(() => {
    let cancelled = false;
    listBillingAccounts(toParams(query))
      .then((page) => {
        if (!cancelled) setResult({ for: query, data: page, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "Liste yüklenemedi.";
        setResult({ for: query, data: null, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  function update(patch: Partial<Query>) {
    setQuery((current) => ({ ...current, page: 0, ...patch }));
  }

  const summary = data?.summary;
  const rows = data?.content ?? [];
  const total = summary
    ? summary.paid + summary.dueSoon + summary.overdue + summary.lapsed
    : undefined;
  const filtersActive =
    query.q !== "" ||
    query.collection !== INITIAL_QUERY.collection ||
    query.paymentStyle !== INITIAL_QUERY.paymentStyle ||
    query.dueWithinDays !== INITIAL_QUERY.dueWithinDays ||
    query.sort !== INITIAL_QUERY.sort;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border/60 bg-card lg:grid-cols-4">
        <Metric
          label="Tahsil edilemeyen"
          value={summary ? formatMoney(summary.overdueAmount) : undefined}
          sub={summary ? `${summary.overdue} borçlu üye` : undefined}
          tone="text-destructive"
          className="border-r border-b lg:border-b-0"
          onClick={() => update({ view: "OVERDUE" })}
        />
        <Metric
          label={`Yaklaşan · ${query.dueWithinDays} gün`}
          value={summary ? formatMoney(summary.dueSoonAmount) : undefined}
          sub={summary ? `${summary.dueSoon} üye, otomatik çekim` : undefined}
          className="border-b lg:border-r lg:border-b-0"
          onClick={() => update({ view: "DUE_SOON" })}
        />
        <Metric
          label="Tahsilat takibinde"
          value={summary ? String(summary.openCollections) : undefined}
          sub="açık dosya"
          className="border-r"
          onClick={() => update({ view: "COLLECTION" })}
        />
        <Metric
          label="Ödemesi güncel"
          value={summary ? String(summary.paid) : undefined}
          sub={total != null ? `${total} ücretli üyeden` : undefined}
          onClick={() => update({ view: "PAID" })}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="space-y-3 border-b border-border/60 p-3 sm:p-4">
          <SegmentTabs<View>
            ariaLabel="Ödeme durumu"
            value={query.view}
            onChange={(view) => update({ view })}
            items={[
              { value: "ALL", label: "Tümü", count: total },
              {
                value: "OVERDUE",
                label: "Borçlu",
                count: summary?.overdue,
                tone: STANDING_META.OVERDUE.dot,
              },
              {
                value: "DUE_SOON",
                label: "Yaklaşan",
                count: summary?.dueSoon,
                tone: STANDING_META.DUE_SOON.dot,
              },
              {
                value: "PAID",
                label: "Güncel",
                count: summary?.paid,
                tone: STANDING_META.PAID.dot,
              },
              {
                value: "LAPSED",
                label: "Süresi dolan",
                count: summary?.lapsed,
                tone: STANDING_META.LAPSED.dot,
              },
              {
                value: "COLLECTION",
                label: "Tahsilatta",
                count: summary?.openCollections,
              },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={query.q}
              onChange={(q) => update({ q })}
              placeholder="Üye, e-posta, telefon veya paket ara"
              className="w-full sm:w-72"
            />
            {query.view !== "COLLECTION" ? (
              <FilterSelect
                label="Tahsilat"
                value={query.collection}
                defaultValue={INITIAL_QUERY.collection}
                options={COLLECTION_OPTIONS}
                onChange={(collection) => update({ collection })}
              />
            ) : null}
            <FilterSelect
              label="Ödeme"
              value={query.paymentStyle}
              defaultValue={INITIAL_QUERY.paymentStyle}
              options={STYLE_OPTIONS}
              onChange={(paymentStyle) => update({ paymentStyle })}
            />
            <FilterSelect
              label="Yaklaşan"
              value={String(query.dueWithinDays)}
              defaultValue={String(INITIAL_QUERY.dueWithinDays)}
              options={WINDOW_OPTIONS}
              onChange={(v) => update({ dueWithinDays: Number(v) })}
            />
            <FilterSelect
              label="Sırala"
              value={query.sort}
              defaultValue={INITIAL_QUERY.sort}
              options={SORT_OPTIONS}
              onChange={(sort) => update({ sort })}
            />
            {filtersActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setQuery({ ...INITIAL_QUERY, view: query.view })}
              >
                <RotateCcw />
                Sıfırla
              </Button>
            ) : null}
            <div className="ml-auto">
              <ExportButton kind="billing" />
            </div>
          </div>
        </div>

        {error ? (
          <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-4">Üye</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tahsilat</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Vade</TableHead>
                <TableHead className="pr-4">Son ödeme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn(isLoading && data && "opacity-50")}>
              {isLoading && !data
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j} className={j === 0 ? "pl-4" : ""}>
                          <Skeleton className="h-4 w-full max-w-28" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}

              {!isLoading && !error && rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <p className="text-sm font-medium">Kayıt yok</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Bu filtrelere uyan üye bulunamadı.
                    </p>
                  </TableCell>
                </TableRow>
              ) : null}

              {rows.map((row) => {
                const meta = STANDING_META[row.standing];
                const due = dueText(row.daysUntilDue);
                const late = (row.daysUntilDue ?? 0) < 0;
                const subNote =
                  row.standing === "OVERDUE" && row.subscriptionStatus
                    ? SUBSCRIPTION_NOTES[row.subscriptionStatus]
                    : undefined;
                return (
                  <TableRow
                    key={row.merchantId}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/kullanicilar/${row.merchantId}`)
                    }
                  >
                    <TableCell className="max-w-[240px] pl-4">
                      <div className="truncate font-medium">
                        {row.merchantName ||
                          row.email ||
                          `Üye #${row.merchantId}`}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {row.merchantName && row.email
                          ? row.email
                          : `#${row.merchantId}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {row.packageName ?? row.packageCode ?? "—"}
                        {row.billingPeriod ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {PERIOD_LABELS[row.billingPeriod]}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {paymentMethod(row)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={meta.className}>
                        {meta.label}
                      </Badge>
                      {subNote ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {subNote}
                          {row.graceEndsAt
                            ? ` · ${formatDate(row.graceEndsAt)}`
                            : ""}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {row.collectionStatus ? (
                        <button
                          type="button"
                          className="rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          onClick={() => setCollectionFor(row)}
                        >
                          <CollectionStatusBadge
                            status={row.collectionStatus}
                          />
                        </button>
                      ) : row.standing === "OVERDUE" ||
                        row.standing === "LAPSED" ? (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => setCollectionFor(row)}
                        >
                          Takip başlat
                        </Button>
                      ) : row.standing === "DUE_SOON" ? (
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => setCollectionFor(row)}
                        >
                          Hatırlat
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div
                        className={cn(
                          row.outstandingAmount != null &&
                            "font-medium text-destructive",
                        )}
                      >
                        {formatMoney(
                          row.outstandingAmount ?? row.renewalAmount,
                          row.currency,
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.outstandingAmount != null
                          ? "borç"
                          : row.autoRenew
                            ? "yenileme"
                            : "son tutar"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>{formatDate(row.periodEndsAt)}</div>
                      {due ? (
                        <div
                          className={cn(
                            "text-xs",
                            late ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {due}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="pr-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(row.lastPaidAt)}
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
            unit="üye"
            onPage={(page) => setQuery((c) => ({ ...c, page }))}
          />
        ) : null}
      </div>

      <CollectionDialog
        account={collectionFor}
        onOpenChange={(open) => !open && setCollectionFor(null)}
        onChanged={() => setQuery((current) => ({ ...current }))}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  tone,
  className,
  onClick,
}: {
  label: string;
  value?: string;
  sub?: string;
  tone?: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
        className,
      )}
    >
      <div className="truncate text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-xl font-semibold tabular-nums", tone)}>
        {value ?? <Skeleton className="h-6 w-24" />}
      </div>
      <div className="mt-0.5 min-h-4 truncate text-xs text-muted-foreground">
        {sub}
      </div>
    </button>
  );
}
