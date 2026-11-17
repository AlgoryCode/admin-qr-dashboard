"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  listAuditLog,
  type AuditEntry,
  type AuditPage,
} from "@/lib/api/security";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { FilterSelect, Pager, SearchField } from "./list-toolbar";
import { formatDateTime } from "./security-settings";

const PAGE_SIZE = 50;

type Outcome = "ALL" | "SUCCESS" | "DENIED" | "FAILED";

type Query = {
  q: string;
  outcome: Outcome;
  targetType: string;
  from: string;
  to: string;
  page: number;
};

const EMPTY: Query = {
  q: "",
  outcome: "ALL",
  targetType: "ALL",
  from: "",
  to: "",
  page: 0,
};

const OUTCOME_META: Record<
  AuditEntry["outcome"],
  { label: string; className: string }
> = {
  SUCCESS: {
    label: "Başarılı",
    className: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  },
  DENIED: {
    label: "Yetki yok",
    className: "border-amber-500/30 text-amber-700 dark:text-amber-300",
  },
  FAILED: {
    label: "Hata",
    className: "border-destructive/30 text-destructive",
  },
};

const TARGETS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tümü" },
  { value: "users", label: "Üyeler" },
  { value: "collections", label: "Tahsilat" },
  { value: "payments", label: "Ödemeler" },
  { value: "packages", label: "Paketler" },
  { value: "products", label: "Ürünler" },
  { value: "coupons", label: "Kuponlar" },
  { value: "dashboard-users", label: "Yöneticiler" },
  { value: "auth", label: "Giriş / hesap" },
];

const METHOD_LABEL: Record<string, string> = {
  POST: "Oluşturdu",
  PUT: "Güncelledi",
  PATCH: "Güncelledi",
  DELETE: "Sildi",
};

/** "POST /users/{id}/package" → readable Turkish. Falls back to the raw action. */
function describe(entry: AuditEntry) {
  const p = entry.path.replace(/^\/api\/v1/, "");
  if (p.startsWith("/dashboard/auth/login/mfa")) return "Giriş (2. adım)";
  if (p.startsWith("/dashboard/auth/login")) return "Giriş";
  if (p.startsWith("/dashboard/auth/logout")) return "Çıkış";
  if (p.startsWith("/dashboard/auth/password"))
    return "Kendi şifresini değiştirdi";
  if (p.startsWith("/dashboard/auth/mfa/enable"))
    return "İki adımlı doğrulamayı açtı";
  if (p.startsWith("/dashboard/auth/mfa/disable"))
    return "İki adımlı doğrulamayı kapattı";
  if (p.startsWith("/dashboard/auth/mfa/setup"))
    return "İki adımlı doğrulama kurulumu";
  if (p.startsWith("/dashboard/auth/sessions")) return "Oturum kapattı";
  return `${METHOD_LABEL[entry.method] ?? entry.method} · ${p.replace(/^\/admin/, "")}`;
}

export function AuditLogPanel() {
  const [query, setQuery] = useState<Query>(EMPTY);
  const [result, setResult] = useState<{
    for: Query;
    data?: AuditPage;
    error?: string;
  } | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const loading = result?.for !== query;
  const data = result?.data;

  useEffect(() => {
    let cancelled = false;
    listAuditLog({
      q: query.q || undefined,
      outcome: query.outcome === "ALL" ? undefined : query.outcome,
      targetType: query.targetType === "ALL" ? undefined : query.targetType,
      from: query.from || undefined,
      to: query.to || undefined,
      page: query.page,
      size: PAGE_SIZE,
    })
      .then((page) => {
        if (!cancelled) setResult({ for: query, data: page });
      })
      .catch((err) => {
        if (!cancelled)
          setResult({
            for: query,
            error:
              err instanceof Error ? err.message : "İşlem geçmişi alınamadı.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const update = (patch: Partial<Query>) =>
    setQuery((q) => ({ ...q, page: 0, ...patch }));
  const dirty = JSON.stringify({ ...query, page: 0 }) !== JSON.stringify(EMPTY);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">İşlem Geçmişi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paneldeki her değişiklik: kim, ne zaman, neyi. Şifre ve kod gibi
          alanlar gizlenir.
        </p>
      </div>

      <div className="space-y-2">
        <SearchField
          value={query.q}
          onChange={(q) => update({ q })}
          placeholder="Yönetici, adres veya içerikte ara"
          className="w-full sm:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Sonuç"
            value={query.outcome}
            defaultValue="ALL"
            options={[
              { value: "ALL", label: "Tümü" },
              { value: "SUCCESS", label: "Başarılı" },
              { value: "DENIED", label: "Yetki yok" },
              { value: "FAILED", label: "Hata" },
            ]}
            onChange={(outcome) => update({ outcome })}
          />
          <FilterSelect
            label="Alan"
            value={query.targetType}
            defaultValue="ALL"
            options={TARGETS}
            onChange={(targetType) => update({ targetType })}
          />
          <Input
            type="date"
            aria-label="Başlangıç"
            className="h-8 w-auto"
            value={query.from}
            onChange={(e) => update({ from: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">–</span>
          <Input
            type="date"
            aria-label="Bitiş"
            className="h-8 w-auto"
            value={query.to}
            onChange={(e) => update({ to: e.target.value })}
          />
          {dirty ? (
            <Button variant="ghost" size="sm" onClick={() => setQuery(EMPTY)}>
              Sıfırla
            </Button>
          ) : null}
        </div>
      </div>

      {result?.error && !loading ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {result.error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border/60">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Zaman</TableHead>
                <TableHead>Yönetici</TableHead>
                <TableHead>İşlem</TableHead>
                <TableHead>Hedef</TableHead>
                <TableHead>Sonuç</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !data ? (
                Array.from({ length: 8 }, (_, i) => (
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
                    Bu filtrelerle kayıt yok.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((entry) => {
                  const expanded = open === entry.id;
                  return (
                    <Fragment key={entry.id}>
                      <TableRow
                        className={
                          loading
                            ? "cursor-pointer opacity-60"
                            : "cursor-pointer"
                        }
                        onClick={() => setOpen(expanded ? null : entry.id)}
                      >
                        <TableCell>
                          {expanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {entry.actorName ?? "—"}
                          </div>
                          {entry.actorRole ? (
                            <div className="text-xs text-muted-foreground">
                              {entry.actorRole}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate text-sm">
                          {describe(entry)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {entry.targetType
                            ? `${entry.targetType}${entry.targetId ? ` #${entry.targetId}` : ""}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={OUTCOME_META[entry.outcome].className}
                          >
                            {OUTCOME_META[entry.outcome].label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell />
                          <TableCell colSpan={5}>
                            <dl className="grid gap-2 py-1 text-xs sm:grid-cols-[120px_1fr]">
                              <dt className="text-muted-foreground">İstek</dt>
                              <dd className="font-mono break-all">
                                {entry.method} {entry.path} → {entry.status}
                              </dd>
                              <dt className="text-muted-foreground">
                                IP / cihaz
                              </dt>
                              <dd className="break-all">
                                {entry.ipAddress ?? "—"} ·{" "}
                                {entry.userAgent ?? "—"}
                              </dd>
                              {entry.requestBody ? (
                                <>
                                  <dt className="text-muted-foreground">
                                    Gönderilen
                                  </dt>
                                  <dd>
                                    <pre className="max-h-48 overflow-auto rounded bg-background p-2 font-mono text-[11px] whitespace-pre-wrap">
                                      {pretty(entry.requestBody)}
                                    </pre>
                                  </dd>
                                </>
                              ) : null}
                            </dl>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
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
          unit="kayıt"
        />
      </div>
    </div>
  );
}

function pretty(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}
