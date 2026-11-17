"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAlgoryData } from "@/context/algory-data-context";
import { createProduct, getCatalogCodes, updateProduct } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import type { CatalogCodeOption, CatalogCodes } from "@/lib/api/types";
import type {
  ProductBillingType,
  ProductRequest,
  ProductResponse,
  ProductType,
} from "@/lib/api/types";
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

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  PACKAGE_PRODUCT: "Paket ürünü",
  ADDON_PRODUCT: "Ek modül",
};

export const BILLING_TYPE_LABELS: Record<ProductBillingType, string> = {
  RECURRING: "Her dönem yenilenir",
  ONE_TIME: "Tek seferlik",
};

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductResponse | null;
}

type FormState = {
  code: string;
  name: string;
  description: string;
  type: ProductType;
  featureCode: string;
  scopeCode: string;
  unitPrice: string;
  vatRate: string;
  billingType: ProductBillingType;
  consumable: boolean;
  addonPurchasable: boolean;
  active: boolean;
};

function initialState(product?: ProductResponse | null): FormState {
  return {
    code: product?.code ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    type: product?.type ?? "PACKAGE_PRODUCT",
    featureCode: product?.featureCode ?? product?.code ?? "",
    scopeCode: product?.scopeCode ?? "",
    unitPrice: product ? String(product.unitPrice) : "0",
    vatRate: product ? String(product.vatRate) : "20",
    billingType: product?.billingType ?? "RECURRING",
    consumable: product?.consumable ?? false,
    addonPurchasable: product?.addonPurchasable ?? false,
    active: product?.active ?? true,
  };
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { refresh } = useAlgoryData();
  const isEdit = !!product;
  const inPackages = (product?.packageCount ?? 0) > 0;

  const [form, setForm] = useState<FormState>(() => initialState(product));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [codes, setCodes] = useState<CatalogCodes | null>(null);
  const [codesError, setCodesError] = useState(false);

  useEffect(() => {
    if (!open || codes) return;
    let cancelled = false;
    getCatalogCodes()
      .then((result) => {
        if (!cancelled) setCodes(result);
      })
      .catch(() => {
        if (!cancelled) setCodesError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, codes]);

  const featureOptions = withCurrent(codes?.features ?? [], form.featureCode);
  const scopeOptions = withCurrent(codes?.scopes ?? [], form.scopeCode);

  function chooseFeature(featureCode: string) {
    setForm((prev) => {
      const ownerScope = `${featureCode}_OWNER`;
      const scopeCode =
        !prev.scopeCode && codes?.scopes.some((scope) => scope.code === ownerScope) ? ownerScope : prev.scopeCode;
      return { ...prev, featureCode, scopeCode };
    });
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = form.code.trim().toUpperCase();
    const featureCode = form.featureCode.trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      setError("Kod büyük harf ile başlamalı; yalnızca büyük harf, rakam ve _ içermeli.");
      return;
    }
    if (!featureCode) {
      setError("Bir hak kodu seçin.");
      return;
    }

    const payload: ProductRequest = {
      code,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      featureCode: featureCode || undefined,
      scopeCode: form.scopeCode.trim() || undefined,
      unitPrice: Number(form.unitPrice || 0),
      vatRate: Number(form.vatRate || 20),
      billingType: form.billingType,
      consumable: form.consumable,
      addonPurchasable: form.addonPurchasable,
      active: form.active,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && product) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
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

  const priceWithVat = Number(form.unitPrice || 0) * (1 + Number(form.vatRate || 0) / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ürünü düzenle" : "Yeni ürün"}</DialogTitle>
          <DialogDescription>
            Ürün, kullanıcıya verilen bir haktır. Paketler ürünleri adetleriyle birleştirir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-code">Ürün kodu</Label>
              <Input
                id="product-code"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="QR_MENU"
                required
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground">Kod oluşturulduktan sonra değişmez.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">Ad</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="QR Menü"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-desc">Açıklama</Label>
            <Textarea
              id="product-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select value={form.type} onValueChange={(v) => v && set("type", v as ProductType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{PRODUCT_TYPE_LABELS[form.type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {PRODUCT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Faturalama</Label>
              <Select
                value={form.billingType}
                onValueChange={(v) => v && set("billingType", v as ProductBillingType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{BILLING_TYPE_LABELS[form.billingType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BILLING_TYPE_LABELS) as ProductBillingType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {BILLING_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-feature">Hak kodu</Label>
              {codesError ? (
                <Input
                  id="product-feature"
                  value={form.featureCode}
                  onChange={(e) => set("featureCode", e.target.value.toUpperCase())}
                  disabled={isEdit && inPackages}
                  placeholder="ONLINE_ORDER"
                />
              ) : (
              <Select
                value={form.featureCode || null}
                onValueChange={(v) => v && chooseFeature(v)}
                disabled={(isEdit && inPackages) || !codes}
              >
                <SelectTrigger id="product-feature" className="w-full">
                  <SelectValue>
                    {form.featureCode ? optionLabel(featureOptions, form.featureCode) : "Hak seçin"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {featureOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label} · {option.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              )}
              <p className="text-xs text-muted-foreground">
                {isEdit && inPackages
                  ? "Paketlerde kullanıldığı için değiştirilemez."
                  : "Uygulamanın kontrol ettiği hak. Yalnızca tanımlı haklar seçilebilir."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-scope">Erişim kapsamı</Label>
              {codesError ? (
                <Input
                  id="product-scope"
                  value={form.scopeCode}
                  onChange={(e) => set("scopeCode", e.target.value.toUpperCase())}
                  placeholder="Boş bırakılabilir"
                />
              ) : (
              <Select
                value={form.scopeCode || NO_SCOPE}
                onValueChange={(v) => v && set("scopeCode", v === NO_SCOPE ? "" : v)}
                disabled={!codes}
              >
                <SelectTrigger id="product-scope" className="w-full">
                  <SelectValue>
                    {form.scopeCode ? optionLabel(scopeOptions, form.scopeCode) : "Yok"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SCOPE}>Yok</SelectItem>
                  {scopeOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label} · {option.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              )}
              <p className="text-xs text-muted-foreground">
                {codesError ? "Kod listesi alınamadı; kodu elle yazın. Sunucu tanımsız kodu reddeder." : "Panelde açılacak ekranlar için (opsiyonel)."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="product-price">Birim fiyat (KDV hariç)</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => set("unitPrice", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-vat">KDV %</Label>
              <Input
                id="product-vat"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.vatRate}
                onChange={(e) => set("vatRate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>KDV dahil</Label>
              <p className="flex h-9 items-center text-sm font-medium tabular-nums">
                {priceWithVat.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 p-3">
            <ToggleRow
              id="product-consumable"
              label="Adetli (kullanıldıkça azalır)"
              hint="Örn. rapor hakkı. Adetli ürünler ek modül olarak tekrar tekrar alınabilir."
              checked={form.consumable}
              onChange={(v) => set("consumable", v)}
            />
            <ToggleRow
              id="product-addon"
              label="Tek başına satılır"
              hint="Modüller sayfasında ek modül olarak satın alınabilir."
              checked={form.addonPurchasable}
              onChange={(v) => set("addonPurchasable", v)}
            />
            <ToggleRow
              id="product-active"
              label="Aktif"
              hint="Pasif ürün yeni paketlere eklenemez. Aktif paketlerde kullanılan ürün pasifleştirilemez."
              checked={form.active}
              onChange={(v) => set("active", v)}
            />
          </div>

          {isEdit && inPackages && (
            <p className="text-xs text-muted-foreground">
              Fiyat değişikliği bu ürünü içeren paketlerin fiyatını günceller. Mevcut abonelikler
              satın aldıkları fiyatla yenilenmeye devam eder.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : isEdit ? "Kaydet" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function CreateProductButton() {
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
        Yeni ürün
      </Button>
      <ProductFormDialog key={instance} open={open} onOpenChange={setOpen} />
    </>
  );
}

const NO_SCOPE = "__none__";

/** Keeps a code saved before the list existed selectable, so editing an old product does not drop it. */
function withCurrent(options: CatalogCodeOption[], current: string): CatalogCodeOption[] {
  if (!current || options.length === 0 || options.some((option) => option.code === current)) return options;
  return [...options, { code: current, label: "Eski kod" }];
}

function optionLabel(options: CatalogCodeOption[], code: string): string {
  const option = options.find((candidate) => candidate.code === code);
  return option ? `${option.label} · ${code}` : code;
}
