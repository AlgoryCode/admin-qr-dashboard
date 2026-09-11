"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { COUPONS_PAGE_SIZE, createCoupon, listCoupons, revokeCoupon } from "@/lib/api/coupons";
import { ApiError } from "@/lib/api/client";
import type { CouponCreateRequest, CouponDiscountType, CouponResponse, CouponStatus } from "@/lib/api/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: CouponStatus) {
  switch (status) {
    case "UNUSED":
      return "Kullanilmadi";
    case "RESERVED":
      return "Rezerve";
    case "USED":
      return "Kullanildi";
    case "REVOKED":
      return "Iptal";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function discountLabel(coupon: CouponResponse) {
  if (coupon.discountType === "PERCENT") {
    return `%${coupon.discountValue}`;
  }
  return `${coupon.discountValue} TL`;
}

export function CouponsPanel() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (pageIndex: number, search: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listCoupons(pageIndex, COUPONS_PAGE_SIZE, search || undefined);
      setCoupons(result.content);
      setTotalPages(result.totalPages);
      setHasNext(result.hasNext);
      setPage(result.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kuponlar yuklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, query);
  }, [load, query]);

  async function handleRevoke(id: number) {
    setBusyId(id);
    try {
      await revokeCoupon(id);
      await load(page, query);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kupon iptal edilemedi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">Kuponlar</CardTitle>
          <CardDescription>Tek kullanımlık indirim kodları</CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Yeni kupon
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Kod ara"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xs"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Kod</TableHead>
                <TableHead>Indirim</TableHead>
                <TableHead>Gecerlilik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Islem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Henuz kupon yok.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{coupon.code}</code>
                    </TableCell>
                    <TableCell>{discountLabel(coupon)}</TableCell>
                    <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge variant={coupon.status === "UNUSED" ? "default" : "secondary"}>
                        {statusLabel(coupon.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {coupon.status === "UNUSED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === coupon.id}
                          onClick={() => void handleRevoke(coupon.id)}
                        >
                          {busyId === coupon.id ? <Loader2 className="size-4 animate-spin" /> : "Iptal et"}
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0 || isLoading}
              onClick={() => void load(page - 1, query)}
            >
              Onceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext || isLoading}
              onClick={() => void load(page + 1, query)}
            >
              Sonraki
            </Button>
          </div>
        ) : null}
      </CardContent>
      <CouponCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load(0, query)}
      />
    </Card>
  );
}

function CouponCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Indirim degeri gecersiz");
      return;
    }
    if (!expiresAt) {
      setError("Gecerlilik tarihi zorunludur");
      return;
    }
    const payload: CouponCreateRequest = {
      code: code.trim(),
      discountType,
      discountValue: value,
      expiresAt: `${expiresAt}:00`,
    };
    setIsSubmitting(true);
    setError(null);
    try {
      await createCoupon(payload);
      setCode("");
      setDiscountValue("");
      setExpiresAt("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kupon olusturulamadi");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>Yeni kupon</DialogTitle>
            <DialogDescription>Tek kullanimlik kod. Gecerlilik tarihi zorunludur.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code">Kod</Label>
              <Input
                id="coupon-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                maxLength={32}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="coupon-type">Tip</Label>
                <select
                  id="coupon-type"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={discountType}
                  onChange={(event) => setDiscountType(event.target.value as CouponDiscountType)}
                >
                  <option value="PERCENT">Yuzde</option>
                  <option value="AMOUNT">Tutar</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coupon-value">Deger</Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-expires">Gecerlilik tarihi</Label>
              <Input
                id="coupon-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Olustur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
