"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAlgoryData } from "@/context/algory-data-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  BILLING_TYPE_LABELS,
  CreateProductButton,
  PRODUCT_TYPE_LABELS,
  ProductFormDialog,
} from "./product-form-dialog";
import { CreatePackageButton, PackageFormDialog } from "./package-form-dialog";
import type { PlanPackageResponse, ProductResponse } from "@/lib/api/types";

function money(value: number | null | undefined, currency = "TRY") {
  if (value == null) return "—";
  return Number(value).toLocaleString("tr-TR", { style: "currency", currency });
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{children}</code>;
}

export function ProductsTable() {
  const { products, isLoading, error } = useAlgoryData();
  const [editProduct, setEditProduct] = useState<ProductResponse | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Ürünler</CardTitle>
            <CardDescription>Kullanıcıya verilen haklar. Paketler bu ürünleri adetleriyle birleştirir.</CardDescription>
          </div>
          <CreateProductButton />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Ürün</TableHead>
                <TableHead>Hak kodu</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead className="text-right">Fiyat (KDV dahil)</TableHead>
                <TableHead>Faturalama</TableHead>
                <TableHead className="text-right">Paket</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Henüz ürün yok.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className={product.active ? undefined : "opacity-60"}>
                    <TableCell>
                      <p className="font-medium">{product.name}</p>
                      <Code>{product.code}</Code>
                    </TableCell>
                    <TableCell>
                      <Code>{product.featureCode ?? product.code}</Code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
                      {product.consumable && (
                        <Badge variant="outline" className="ml-1.5 text-[10px] font-normal">
                          Adetli
                        </Badge>
                      )}
                      {product.addonPurchasable && (
                        <Badge variant="outline" className="ml-1.5 text-[10px] font-normal">
                          Tek satılır
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(product.priceWithVat)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {BILLING_TYPE_LABELS[product.billingType] ?? product.billingType}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{product.packageCount}</TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Aktif" : "Arşivde"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`${product.name} ürününü düzenle`}
                        onClick={() => setEditProduct(product)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductFormDialog
        key={editProduct?.id ?? "none"}
        open={!!editProduct}
        onOpenChange={(v) => !v && setEditProduct(null)}
        product={editProduct}
      />
    </>
  );
}

export function PackagesTable() {
  const { packages, isLoading, error } = useAlgoryData();
  const [editPackage, setEditPackage] = useState<PlanPackageResponse | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Paketler</CardTitle>
            <CardDescription>Satılan planlar. Fiyat, içeriğin KDV dahil toplamından indirim düşülerek hesaplanır.</CardDescription>
          </div>
          <CreatePackageButton />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Paket</TableHead>
                <TableHead className="text-right">Aylık</TableHead>
                <TableHead className="text-right">Yıllık</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead>İçerik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Henüz paket yok. Önce ürün oluşturun.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg) => (
                  <TableRow key={pkg.id} className={pkg.active ? undefined : "opacity-60"}>
                    <TableCell>
                      <p className="font-medium">{pkg.name}</p>
                      <Code>{pkg.code}</Code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <p className="font-medium">{money(pkg.effectiveMonthlyPrice, pkg.currency)}</p>
                      {Number(pkg.monthlyDiscount) > 0 && (
                        <p className="text-xs text-muted-foreground line-through">{money(pkg.price, pkg.currency)}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(pkg.effectiveYearlyPrice, pkg.currency)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{pkg.validityDays} gün</TableCell>
                    <TableCell>
                      <div className="flex max-w-[280px] flex-wrap gap-1">
                        {pkg.items.map((item) => (
                          <Badge key={item.id} variant="outline" className="text-[10px] font-normal">
                            {item.productName} {item.unlimited ? "∞" : `×${item.quantity}`}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={pkg.active ? "default" : "secondary"}>
                          {pkg.active ? "Aktif" : "Arşivde"}
                        </Badge>
                        {pkg.systemManaged ? (
                          <Badge variant="outline">Sistem</Badge>
                        ) : pkg.purchasable ? (
                          <Badge variant="outline">Satışta</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`${pkg.name} paketini düzenle`}
                        onClick={() => setEditPackage(pkg)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PackageFormDialog
        key={editPackage?.id ?? "none"}
        open={!!editPackage}
        onOpenChange={(v) => !v && setEditPackage(null)}
        pkg={editPackage}
      />
    </>
  );
}
