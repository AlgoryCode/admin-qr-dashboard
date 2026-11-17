"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus } from "lucide-react";
import {
  cancelSchedule,
  createSchedule,
  listSchedules,
  type CatalogSchedule,
  type ScheduleStatus,
} from "@/lib/api/catalog-plans";
import { getAdminPackages } from "@/lib/api/packages";
import { getProducts } from "@/lib/api/products";
import type { PlanPackageResponse, ProductResponse } from "@/lib/api/types";
import { useAuth } from "@/context/auth-context";
import { canWrite } from "@/lib/auth/permissions";
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
import { money } from "./revenue-panel";

const STATUS_META: Record<
  ScheduleStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: "Planlandı",
    className: "border-sky-500/30 text-sky-700 dark:text-sky-300",
  },
  ACTIVE: {
    label: "Yayında",
    className: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  },
  DONE: { label: "Tamamlandı", className: "text-muted-foreground" },
  CANCELLED: {
    label: "İptal",
    className: "text-muted-foreground line-through",
  },
  FAILED: {
    label: "Uygulanamadı",
    className: "border-destructive/30 text-destructive",
  },
};

function when(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function change(s: CatalogSchedule) {
  if (s.targetType === "PRODUCT") {
    const before = s.prevUnitPrice ?? s.currentListPrice;
    return `Birim fiyat ${money(before)} → ${money(s.unitPrice)}`;
  }
  const parts: string[] = [];
  if (s.monthlyDiscount != null)
    parts.push(`aylık ${money(s.monthlyDiscount)} indirim`);
  if (s.yearlyDiscount != null)
    parts.push(`yıllık ${money(s.yearlyDiscount)} indirim`);
  return parts.join(" · ");
}

export function PriceSchedulePanel() {
  const { user } = useAuth();
  const editable = canWrite(user?.adminRole, "money");
  const [rows, setRows] = useState<CatalogSchedule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSchedules()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Planlar alınamadı.");
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function cancel(s: CatalogSchedule) {
    const question =
      s.status === "ACTIVE"
        ? `"${s.label}" şimdi bitirilsin ve eski fiyatlar geri gelsin mi?`
        : `"${s.label}" iptal edilsin mi?`;
    if (!window.confirm(question)) return;
    setBusy(s.id);
    setError(null);
    try {
      await cancelSchedule(s.id);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İptal edilemedi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">
            Kampanyalar ve fiyat planı
          </CardTitle>
          <CardDescription>
            İleri tarihli fiyat değişikliği ya da süreli paket indirimi. Süre
            bitince eski değerler kendiliğinden geri gelir. Mevcut abonelerin
            yenileme tutarı değişmez; yeni satın almalar etkilenir.
          </CardDescription>
        </div>
        {editable ? (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus />
            Yeni plan
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Değişiklik</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows == null ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Planlanmış kampanya ya da fiyat değişikliği yok.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.targetType === "PACKAGE" ? "Paket" : "Ürün"} ·{" "}
                        {s.targetName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {change(s)}
                      {s.lastError ? (
                        <div className="text-xs text-destructive">
                          {s.lastError}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {when(s.startsAt)}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {s.endsAt ? (
                        when(s.endsAt)
                      ) : (
                        <span className="text-muted-foreground">Kalıcı</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_META[s.status].className}
                      >
                        {STATUS_META[s.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editable &&
                      (s.status === "SCHEDULED" || s.status === "ACTIVE") ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={busy != null}
                          onClick={() => cancel(s)}
                        >
                          {busy === s.id ? (
                            <Loader2 className="animate-spin" />
                          ) : null}
                          {s.status === "ACTIVE" ? "Şimdi bitir" : "İptal"}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CreateDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={() => {
          setCreating(false);
          setReload((n) => n + 1);
        }}
      />
    </Card>
  );
}

type Form = {
  kind: "CAMPAIGN" | "PRICE";
  targetId: string;
  label: string;
  unitPrice: string;
  monthlyDiscount: string;
  yearlyDiscount: string;
  startsAt: string;
  endsAt: string;
};

function localInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(): Form {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return {
    kind: "CAMPAIGN",
    targetId: "",
    label: "",
    unitPrice: "",
    monthlyDiscount: "",
    yearlyDiscount: "",
    startsAt: localInput(start),
    endsAt: localInput(end),
  };
}

function CreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<Form>(emptyForm);
  const [packages, setPackages] = useState<PlanPackageResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([getAdminPackages(), getProducts()])
      .then(([pk, pr]) => {
        if (cancelled) return;
        setPackages(pk.filter((p) => p.purchasable && p.active));
        setProducts(pr.filter((p) => p.active));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const campaign = form.kind === "CAMPAIGN";
  const pkg = packages.find((p) => String(p.id) === form.targetId);
  const product = products.find((p) => String(p.id) === form.targetId);
  const targets = campaign
    ? packages.map((p) => ({
        value: String(p.id),
        label: `${p.name} · ${money(p.price)}`,
      }))
    : products.map((p) => ({
        value: String(p.id),
        label: `${p.name} · ${money(p.unitPrice)}`,
      }));

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await createSchedule({
        targetType: campaign ? "PACKAGE" : "PRODUCT",
        targetId: Number(form.targetId),
        label: form.label,
        unitPrice:
          !campaign && form.unitPrice ? Number(form.unitPrice) : undefined,
        monthlyDiscount:
          campaign && form.monthlyDiscount
            ? Number(form.monthlyDiscount)
            : undefined,
        yearlyDiscount:
          campaign && form.yearlyDiscount
            ? Number(form.yearlyDiscount)
            : undefined,
        startsAt: `${form.startsAt}:00`,
        endsAt: form.endsAt ? `${form.endsAt}:00` : undefined,
      });
      setForm(emptyForm());
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni plan</DialogTitle>
          <DialogDescription>
            Başlangıç geçmişteyse hemen uygulanır.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["CAMPAIGN", "Paket kampanyası", "Süreli indirim"],
                ["PRICE", "Fiyat değişikliği", "Ürün birim fiyatı"],
              ] as const
            ).map(([kind, title, hint]) => (
              <button
                key={kind}
                type="button"
                onClick={() =>
                  set({
                    kind,
                    targetId: "",
                    endsAt: kind === "PRICE" ? "" : emptyForm().endsAt,
                  })
                }
                className={
                  form.kind === kind
                    ? "rounded-lg border border-primary bg-primary/5 p-3 text-left"
                    : "rounded-lg border border-border/60 p-3 text-left hover:bg-muted/40"
                }
              >
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{hint}</div>
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-label">Ad</Label>
            <Input
              id="plan-label"
              value={form.label}
              placeholder={
                campaign
                  ? "Örn. Kasım kampanyası"
                  : "Örn. 2027 fiyat güncellemesi"
              }
              onChange={(e) => set({ label: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{campaign ? "Paket" : "Ürün"}</Label>
            <Select
              value={form.targetId || null}
              onValueChange={(v) => set({ targetId: (v as string) ?? "" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {targets.find((t) => t.value === form.targetId)?.label ??
                    "Seçin"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {campaign ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan-monthly">Aylık indirim (₺)</Label>
                <Input
                  id="plan-monthly"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.monthlyDiscount}
                  onChange={(e) => set({ monthlyDiscount: e.target.value })}
                />
                {pkg && form.monthlyDiscount ? (
                  <p className="text-xs text-muted-foreground">
                    {money(pkg.price)} →{" "}
                    {money(pkg.price - Number(form.monthlyDiscount))} / ay
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-yearly">Yıllık indirim (₺)</Label>
                <Input
                  id="plan-yearly"
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={pkg != null && !pkg.yearlyPrice}
                  value={form.yearlyDiscount}
                  onChange={(e) => set({ yearlyDiscount: e.target.value })}
                />
                {pkg && !pkg.yearlyPrice ? (
                  <p className="text-xs text-muted-foreground">
                    Bu paketin yıllık fiyatı yok.
                  </p>
                ) : pkg?.yearlyPrice && form.yearlyDiscount ? (
                  <p className="text-xs text-muted-foreground">
                    {money(pkg.yearlyPrice)} →{" "}
                    {money(pkg.yearlyPrice - Number(form.yearlyDiscount))} / yıl
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">
                Yeni birim fiyat (KDV hariç, ₺)
              </Label>
              <Input
                id="plan-price"
                type="number"
                min={0}
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => set({ unitPrice: e.target.value })}
              />
              {product ? (
                <p className="text-xs text-muted-foreground">
                  Şu an {money(product.unitPrice)}. Bu ürünü içeren paketlerin
                  fiyatı da güncellenir.
                </p>
              ) : null}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-start">Başlangıç</Label>
              <Input
                id="plan-start"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set({ startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-end">
                Bitiş {campaign ? "" : "(isteğe bağlı)"}
              </Label>
              <Input
                id="plan-end"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => set({ endsAt: e.target.value })}
              />
            </div>
          </div>
          {!campaign && form.endsAt ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              Bitişte eski fiyata dönülür.
            </p>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button
            disabled={
              saving ||
              !form.targetId ||
              !form.label.trim() ||
              (campaign && !form.endsAt)
            }
            onClick={submit}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            Planla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
