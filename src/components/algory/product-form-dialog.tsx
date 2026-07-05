"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAlgoryData } from "@/context/algory-data-context";
import { createProduct, updateProduct } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import type { ProductResponse } from "@/lib/api/types";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductResponse | null;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const { refresh } = useAlgoryData();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setActive(product?.active ?? true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      code: "QR_CREATE" as const,
      name,
      description: description || undefined,
      active,
    };

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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ürün Düzenle" : "Yeni Ürün Oluştur"}</DialogTitle>
          <DialogDescription>
            QR servisine yeni bir ürün tanımlayın. Kod: QR_CREATE
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Ürün Adı</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="QR Oluşturma Hakkı"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-desc">Açıklama</Label>
            <Textarea
              id="product-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ürün açıklaması..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="product-active">Aktif</Label>
            <Switch id="product-active" checked={active} onCheckedChange={setActive} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateProductButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Yeni Ürün
      </Button>
      <ProductFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
