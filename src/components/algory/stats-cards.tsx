"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CreditCard,
  Package,
  QrCode,
} from "lucide-react";
import { useAlgoryData } from "@/context/algory-data-context";
import { formatCurrency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AlgoryStatsCards() {
  const { products, packages, isLoading } = useAlgoryData();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activePackages = packages.filter((p) => p.active);
  const activeProducts = products.filter((p) => p.active);
  const totalRevenuePotential = activePackages.reduce(
    (sum, p) => sum + Number(p.price),
    0
  );
  const totalItemsInPackages = packages.reduce(
    (sum, p) => sum + p.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const cards = [
    {
      label: "Toplam Paket",
      icon: Package,
      value: String(packages.length),
      sub: `${activePackages.length} aktif`,
      positive: true,
    },
    {
      label: "Toplam Ürün",
      icon: Box,
      value: String(products.length),
      sub: `${activeProducts.length} aktif`,
      positive: true,
    },
    {
      label: "Paket İçi Hak",
      icon: QrCode,
      value: String(totalItemsInPackages),
      sub: "toplam ürün miktarı",
      positive: true,
    },
    {
      label: "Aktif Paket Geliri",
      icon: CreditCard,
      value: formatCurrency(totalRevenuePotential),
      sub: "potansiyel aylık",
      positive: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="border-border/60 bg-card/50 backdrop-blur-sm transition-colors hover:bg-card/80"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {card.label}
            </CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">{card.value}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {card.positive ? (
                <ArrowUpRight className="size-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="size-3 text-red-400" />
              )}
              <span className={cn("text-muted-foreground")}>{card.sub}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
