"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAlgoryData } from "@/context/algory-data-context";
import { formatCurrency } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateProductButton, ProductFormDialog } from "./product-form-dialog";
import { CreatePackageButton, PackageFormDialog } from "./package-form-dialog";
import type { PlanPackageResponse, ProductResponse } from "@/lib/api/types";

export function ProductsTable() {
  const { products, isLoading, error } = useAlgoryData();
  const [editProduct, setEditProduct] = useState<ProductResponse | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Ürünler</CardTitle>
            <CardDescription>
              API: GET/POST/PUT /admin/products
            </CardDescription>
          </div>
          <CreateProductButton />
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Kod</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Henüz ürün yok. Yeni ürün oluşturun.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {product.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {product.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Paketler</CardTitle>
            <CardDescription>
              API: GET/POST/PUT /admin/packages — ürünler items[] ile eklenir
            </CardDescription>
          </div>
          <CreatePackageButton />
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Kod</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Fiyat</TableHead>
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
                    Henüz paket yok. Önce ürün oluşturup paket ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {pkg.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pkg.name}</p>
                        {pkg.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {pkg.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(pkg.price), pkg.currency)}
                    </TableCell>
                    <TableCell>{pkg.validityDays} gün</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pkg.items.map((item) => (
                          <Badge key={item.id} variant="outline" className="text-[10px] font-normal">
                            {item.productName} ×{item.quantity}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.active ? "default" : "secondary"}>
                        {pkg.active ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
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
        open={!!editPackage}
        onOpenChange={(v) => !v && setEditPackage(null)}
        pkg={editPackage}
      />
    </>
  );
}
