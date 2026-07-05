"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAlgoryData } from "@/context/algory-data-context";
import { createPackage, updatePackage } from "@/lib/api/packages";
import { ApiError } from "@/lib/api/client";
import type { PlanPackageResponse } from "@/lib/api/types";
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

interface PackageItemRow {
  productId: string;
  quantity: string;
}

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg?: PlanPackageResponse | null;
}

function emptyItem(): PackageItemRow {
  return { productId: "", quantity: "1" };
}

export function PackageFormDialog({ open, onOpenChange, pkg }: PackageFormDialogProps) {
  const { products, refresh } = useAlgoryData();
  const isEdit = !!pkg;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [validityDays, setValidityDays] = useState("30");
  const [active, setActive] = useState(true);
  const [items, setItems] = useState<PackageItemRow[]>([emptyItem()]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (pkg) {
      setCode(pkg.code);
      setName(pkg.name);
      setDescription(pkg.description ?? "");
      setPrice(String(pkg.price));
      setCurrency(pkg.currency);
      setValidityDays(String(pkg.validityDays));
      setActive(pkg.active);
      setItems(
        pkg.items.length > 0
          ? pkg.items.map((i) => ({
              productId: String(i.productId),
              quantity: String(i.quantity),
            }))
          : [emptyItem()]
      );
    } else {
      setCode("");
      setName("");
      setDescription("");
      setPrice("");
      setCurrency("TRY");
      setValidityDays("30");
      setActive(true);
      setItems([emptyItem()]);
    }
    setError(null);
  }, [open, pkg]);

  function updateItem(index: number, field: keyof PackageItemRow, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const parsedItems = items
      .filter((i) => i.productId)
      .map((i) => ({
        productId: Number(i.productId),
        quantity: Number(i.quantity),
      }));

    if (parsedItems.length === 0) {
      setError("Paket en az bir ürün içermelidir");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      code: code.toUpperCase(),
      name,
      description: description || undefined,
      price: Number(price),
      currency,
      active,
      validityDays: Number(validityDays),
      items: parsedItems,
    };

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
        const fieldErrors = err.errors
          ? Object.values(err.errors).join(", ")
          : "";
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Paket Düzenle" : "Yeni Paket Oluştur"}</DialogTitle>
          <DialogDescription>
            Pakete ürün ekleyin. Güncellemede mevcut ürünler tamamen yenilenir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-code">Paket Kodu</Label>
              <Input
                id="pkg-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="STARTER"
                required
                disabled={isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-name">Paket Adı</Label>
              <Input
                id="pkg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Starter Paket"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pkg-desc">Açıklama</Label>
            <Textarea
              id="pkg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pkg-price">Fiyat</Label>
              <Input
                id="pkg-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-currency">Para Birimi</Label>
              <Input
                id="pkg-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pkg-days">Geçerlilik (gün)</Label>
              <Input
                id="pkg-days"
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pkg-active">Aktif</Label>
            <Switch id="pkg-active" checked={active} onCheckedChange={setActive} />
          </div>

          <div className="space-y-3 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <Label>Paket İçeriği (Ürünler)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="size-3.5" />
                Ürün Ekle
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Ürün</Label>
                  <Select
                    value={item.productId}
                    onValueChange={(v) => updateItem(index, "productId", v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ürün seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} ({p.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Miktar</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    required
                  />
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Önce en az bir ürün oluşturmalısınız.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting || products.length === 0}>
              {isSubmitting ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreatePackageButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Yeni Paket
      </Button>
      <PackageFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
