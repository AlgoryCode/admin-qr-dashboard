"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, RotateCw } from "lucide-react";
import {
  listInvoices,
  retryInvoice,
  type InvoiceKind,
  type InvoicePage,
  type InvoiceStatus,
} from "@/lib/api/finance";
import { useAuth } from "@/context/auth-context";
import { canWrite } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterSelect, Pager, SearchField } from "./list-toolbar";
import { ExportButton } from "./export-button";
import { money } from "./revenue-panel";

const PAGE_SIZE = 20;

const STATUS_META: Record<InvoiceStatus, { label: string; className: string }> =
  {
    ISSUED: {
      label: "Kesildi",
      className: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    },
    PENDING: {
      label: "Bekliyor",
      className: "border-sky-500/30 text-sky-700 dark:text-sky-300",
    },
    FAILED: {
      label: "Hata",
      className: "border-destructive/30 text-destructive",
    },
    SKIPPED: { label: "Atlandı", className: "text-muted-foreground" },
  };

type Query = {
  q: string;
  status: "ALL" | InvoiceStatus;
  kind: "ALL" | InvoiceKind;
  page: number;
};
const EMPTY: Query = { q: "", status: "ALL", kind: "ALL", page: 0 };

function day(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function InvoicesPanel() {
  const { user } = useAuth();
  const canRetry = canWrite(user?.adminRole, "money");
  const [query, setQuery] = useState<Query>(EMPTY);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: InvoicePage;
    error?: string;
  } | null>(null);
  const [retrying, setRetrying] = useState<number | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const key = JSON.stringify(query) + reload;
  const loading = result?.key !== key;
  const data = result?.data;

  useEffect(() => {
    let cancelled = false;
    listInvoices({
      q: query.q || undefined,
      status: query.status === "ALL" ? undefined : query.status,
      kind: query.kind === "ALL" ? undefined : query.kind,
      page: query.page,
      size: PAGE_SIZE,
    })
      .then((page) => {
        if (!cancelled) setResult({ key, data: page });
      })
      .catch((err) => {
        if (!cancelled)
          setResult({
            key,
            error: err instanceof Error ? err.message : "Faturalar alınamadı.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [query, key]);

  const update = (patch: Partial<Query>) =>
    setQuery((q) => ({ ...q, page: 0, ...patch }));

  async function retry(id: number) {
    setRetrying(id);
    setRetryError(null);
    try {
      await retryInvoice(id);
      setReload((n) => n + 1);
    } catch (err) {
      setRetryError(
        err instanceof Error ? err.message : "Fatura yeniden denenemedi.",
      );
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="space-y-3">
      {data && (data.failed > 0 || data.pending > 0) ? (
        <div className="flex flex-wrap gap-2 text-sm">
          {data.failed > 0 ? (
            <button
              type="button"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-destructive"
              onClick={() => update({ status: "FAILED" })}
            >
              {data.failed} fatura kesilemedi
            </button>
          ) : null}
          {data.pending > 0 ? (
            <button
              type="button"
              className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-sky-700 dark:text-sky-300"
              onClick={() => update({ status: "PENDING" })}
            >
              {data.pending} fatura bekliyor
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={query.q}
          onChange={(q) => update({ q })}
          placeholder="Alıcı, e-posta, VKN veya fatura no"
          className="w-full sm:max-w-xs"
        />
        <FilterSelect
          label="Durum"
          value={query.status}
          defaultValue="ALL"
          options={[
            { value: "ALL", label: "Tümü" },
            { value: "ISSUED", label: "Kesildi" },
            { value: "PENDING", label: "Bekliyor" },
            { value: "FAILED", label: "Hata" },
            { value: "SKIPPED", label: "Atlandı" },
          ]}
          onChange={(status) => update({ status })}
        />
        <FilterSelect
          label="Tür"
          value={query.kind}
          defaultValue="ALL"
          options={[
            { value: "ALL", label: "Tümü" },
            { value: "SALE", label: "Satış" },
            { value: "REFUND", label: "İade" },
          ]}
          onChange={(kind) => update({ kind })}
        />
        <div className="ml-auto">
          <ExportButton kind="invoices" />
        </div>
      </div>

      {result?.error || retryError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {retryError ?? result?.error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border/60">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Alıcı</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !data ? (
                Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Bu filtrelerle fatura yok.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className={loading ? "opacity-60" : undefined}
                  >
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      {day(inv.issuedAt ?? inv.createdAt)}
                      {inv.invoiceNumber ? (
                        <div className="font-mono text-xs">
                          {inv.invoiceNumber}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {inv.buyerName ?? `Üye #${inv.merchantId}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inv.buyerTaxId
                          ? `VKN/TCKN ${inv.buyerTaxId}`
                          : (inv.buyerEmail ?? "")}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] text-sm">
                      <div className="truncate">{inv.description ?? "—"}</div>
                      {inv.status === "FAILED" && inv.lastError ? (
                        <div
                          className="truncate text-xs text-destructive"
                          title={inv.lastError}
                        >
                          {inv.lastError} · {inv.attempts} deneme
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_META[inv.status].className}
                      >
                        {inv.kind === "REFUND" ? "İade · " : ""}
                        {STATUS_META[inv.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(
                        inv.kind === "REFUND" ? -inv.total : inv.total,
                        inv.currency,
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {inv.documentUrl ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          nativeButton={false}
                          render={
                            <a
                              href={inv.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          <ExternalLink />
                          Belge
                        </Button>
                      ) : null}
                      {canRetry &&
                      (inv.status === "FAILED" || inv.status === "PENDING") ? (
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={retrying != null}
                          onClick={() => retry(inv.id)}
                        >
                          {retrying === inv.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <RotateCw />
                          )}
                          Yeniden dene
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <Pager
          page={query.page}
          size={PAGE_SIZE}
          total={data?.total ?? 0}
          hasNext={data?.hasNext ?? false}
          disabled={loading}
          onPage={(page) => setQuery((q) => ({ ...q, page }))}
          unit="fatura"
        />
      </div>
    </div>
  );
}
