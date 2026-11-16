"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAlgoryData } from "@/context/algory-data-context";
import { createPackage, updatePackage } from "@/lib/api/packages";
import { ApiError } from "@/lib/api/client";
import type { PlanPackageRequest, PlanPackageResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;

interface PackageItemRow {
  productId: string;
  quantity: string;
  unlimited: boolean;
}

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg?: PlanPackageResponse | null;
}

type FormState = {
  code: string;
  name: string;
  description: string;
  features: string;
  currency: string;
  validityDays: string;
  priority: string;
  monthlyDiscount: string;
  yearlyPrice: string;
  yearlyDiscount: string;
  purchasable: boolean;
  active: boolean;
  items: PackageItemRow[];
};

function emptyItem(): PackageItemRow {
  return { productId: "", quantity: "1", unlimited: false };
}

function initialState(pkg?: PlanPackageResponse | null): FormState {
  return {
    code: pkg?.code ?? "",
    name: pkg?.name ?? "",
    description: pkg?.description ?? "",
    features: (pkg?.features ?? []).join("\n"),
    currency: pkg?.currency ?? "TRY",
    validityDays: String(pkg?.validityDays ?? 30),
    priority: String(pkg?.priority ?? 0),
    monthlyDiscount: String(pkg?.monthlyDiscount ?? 0),
    yearlyPrice: pkg?.yearlyPrice != null ? String(pkg.yearlyPrice) : "",
    yearlyDiscount: String(pkg?.yearlyDiscount ?? 0),
    purchasable: pkg?.purchasable ?? true,
    active: pkg?.active ?? true,
    items:
      pkg && pkg.items.length > 0
        ? pkg.items.map((i) => ({
            productId: String(i.productId),
            quantity: String(i.quantity),
            unlimited: i.unlimited,
          }))
        : [emptyItem()],
  };
}

function money(value: number, currency = "TRY") {
  return value.toLocaleString("tr-TR", { style: "currency", currency });
}

export function PackageFormDialog({ open, onOpenChange, pkg }: PackageFormDialogProps) {
  const { products, refresh } = useAlgoryData();
  const isEdit = !!pkg;
  const systemManaged = pkg?.systemManaged ?? false;

  const [form, setForm] = useState<FormState>(() => initialState(pkg));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<PackageItemRow>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  const productsById = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const chosen = new Set(form.items.map((i) => i.productId));

  // Same rule as the backend: list price is the sum of lines with VAT, unlimited lines count once.
  const listPrice = form.items.reduce((sum, item) => {
    const product = productsById.get(item.productId);
    if (!product) return sum;
    const quantity = item.unlimited ? 1 : Math.max(Number(item.quantity) || 0, 0);
    return sum + Number(product.priceWithVat) * quantity;
  }, 0);
  const monthly = listPrice - (Number(form.monthlyDiscount) || 0);
  const yearly = form.yearlyPrice ? Number(form.yearlyPrice) - (Number(form.yearlyDiscount) || 0) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = form.code.trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      setError("Kod büyük harf ile başlamalı; yalnızca büyük harf, rakam ve _ içermeli.");
      return;
    }
    const items = form.items
      .filter((i) => i.productId)
      .map((i) => ({
        productId: Number(i.productId),
        quantity: i.unlimited ? 1 : Number(i.quantity),
        unlimited: i.unlimited,
      }));
    if (items.length === 0) {
      setError("Paket en az bir ürün içermeli.");
      return;
    }

    const payload: PlanPackageRequest = {
      code,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      currency: form.currency.trim().toUpperCase() || "TRY",
      validityDays: Number(form.validityDays),
      priority: Number(form.priority) || 0,
      monthlyDiscount: Number(form.monthlyDiscount) || 0,
      yearlyPrice: form.yearlyPrice ? Number(form.yearlyPrice) : null,
      yearlyDiscount: Number(form.yearlyDiscount) || 0,
      purchasable: form.purchasable,
      active: form.active,
      items,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && pkg) {
        await updatePackage(pkg.id, payload);
      } else {
        await createPackage(payload);
      }
      await refresh();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = err.errors ? Object.values(err.errors).join(", ") : "";
        setError(fieldErrors || err.message);
      } else {
        setError("İşlem başarısız");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Paketi düzenle" : "Yeni paket"}</DialogTitle>
          <DialogDescription>
            Fiyat, içerdiği ürünlerin KDV dahil toplamıdır. İçerik değişikliği mevcut abonelere bir
            sonraki yenilemede yansır; fiyat değişikliği yalnızca yeni satışları etkiler.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {systemManaged && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Sistem paketi (ücretsiz/deneme): içeriği düzenlenebilir, ancak her zaman aktif kalır ve
              satışa açılamaz.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-code">Paket kodu</Label>
              <Input
                id="pkg-code"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="PRO_PACKAGE"
                required
                disabled={isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-name">Ad</Label>
              <Input
                id="pkg-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Pro"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-desc">Açıklama</Label>
              <Textarea
                id="pkg-desc"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-features">Öne çıkan maddeler (her satır bir madde)</Label>
              <Textarea
                id="pkg-features"
                value={form.features}
                onChange={(e) => set("features", e.target.value)}
                rows={3}
                placeholder={"Sınırsız menü\nAkıllı raporlar"}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <Label>İçerik</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("items", [...form.items, emptyItem()])}
              >
                <Plus className="size-3.5" />
                Ürün ekle
              </Button>
            </div>
            {form.items.map((item, index) => {
              const product = productsById.get(item.productId);
              return (
                <div key={index} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[200px] flex-1 space-y-1">
                    <Label className="text-xs">Ürün</Label>
                    <Select
                      value={item.productId}
                      onValueChange={(v) => updateItem(index, { productId: v ?? "" })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ürün seçin">
                          {product ? `${product.name} (${product.code})` : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(
                            (p) =>
                              String(p.id) === item.productId ||
                              (p.active && !chosen.has(String(p.id)))
                          )
                          .map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} ({p.code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Adet</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.unlimited ? "" : item.quantity}
                      placeholder={item.unlimited ? "∞" : undefined}
                      disabled={item.unlimited}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      required={!item.unlimited}
                    />
                  </div>
                  <label className="flex h-9 items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={item.unlimited}
                      onCheckedChange={(v) => updateItem(index, { unlimited: v })}
                    />
                    Sınırsız
                  </label>
                  <span className="flex h-9 w-24 items-center justify-end text-xs tabular-nums text-muted-foreground">
                    {product
                      ? money(
                          Number(product.priceWithVat) *
                            (item.unlimited ? 1 : Math.max(Number(item.quantity) || 0, 0))
                        )
                      : "—"}
                  </span>
                  {form.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground"
                      aria-label="Satırı kaldır"
                      onClick={() =>
                        set(
                          "items",
                          form.items.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              );
            })}
            {products.length === 0 && (
              <p className="text-xs text-muted-foreground">Önce en az bir ürün oluşturun.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Liste fiyatı (aylık)</Label>
              <p className="flex h-9 items-center text-sm font-medium tabular-nums">
                {money(listPrice, form.currency || "TRY")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-mdisc">Aylık indirim</Label>
              <Input
                id="pkg-mdisc"
                type="number"
                min="0"
                step="0.01"
                value={form.monthlyDiscount}
                onChange={(e) => set("monthlyDiscount", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-yprice">Yıllık fiyat</Label>
              <Input
                id="pkg-yprice"
                type="number"
                min="0"
                step="0.01"
                value={form.yearlyPrice}
                placeholder="Yok"
                onChange={(e) => set("yearlyPrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-ydisc">Yıllık indirim</Label>
              <Input
                id="pkg-ydisc"
                type="number"
                min="0"
                step="0.01"
                value={form.yearlyDiscount}
                disabled={!form.yearlyPrice}
                onChange={(e) => set("yearlyDiscount", e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Satış fiyatı: aylık{" "}
            <span className="font-medium text-foreground">{money(Math.max(monthly, 0), form.currency || "TRY")}</span>
            {yearly != null && (
              <>
                {" · "}yıllık{" "}
                <span className="font-medium text-foreground">{money(Math.max(yearly, 0), form.currency || "TRY")}</span>
              </>
            )}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pkg-days">Geçerlilik (gün)</Label>
              <Input
                id="pkg-days"
                type="number"
                min="1"
                value={form.validityDays}
                onChange={(e) => set("validityDays", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-priority">Sıra</Label>
              <Input
                id="pkg-priority"
                type="number"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-currency">Para birimi</Label>
              <Input
                id="pkg-currency"
                value={form.currency}
                maxLength={3}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-border/60 p-3 sm:grid-cols-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="pkg-purchasable">Satışta</Label>
                <p className="text-xs text-muted-foreground">Paketler sayfasında satın alınabilir.</p>
              </div>
              <Switch
                id="pkg-purchasable"
                checked={form.purchasable}
                disabled={systemManaged}
                onCheckedChange={(v) => set("purchasable", v)}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="pkg-active">Aktif</Label>
                <p className="text-xs text-muted-foreground">Pasif paket satılmaz; mevcut aboneler etkilenmez.</p>
              </div>
              <Switch
                id="pkg-active"
                checked={form.active}
                disabled={systemManaged}
                onCheckedChange={(v) => set("active", v)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting || products.length === 0}>
              {isSubmitting ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreatePackageButton() {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);
  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setInstance((n) => n + 1);
          setOpen(true);
        }}
      >
        <Plus className="size-4" />
        Yeni paket
      </Button>
      <PackageFormDialog key={instance} open={open} onOpenChange={setOpen} />
    </>
  );
}
