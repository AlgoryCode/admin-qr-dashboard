"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAlgoryData } from "@/context/algory-data-context";
import { formatCurrency } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  price: {
    label: "Fiyat",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ReportsSection() {
  const { packages, products, isLoading } = useAlgoryData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const activePackages = packages.filter((p) => p.active);
  const chartData = activePackages.map((p) => ({
    name: p.name.replace(" Paket", ""),
    price: Number(p.price),
    items: p.items.length,
  }));

  const metrics = [
    { label: "Aktif Paket", value: String(activePackages.length) },
    { label: "Aktif Ürün", value: String(products.filter((p) => p.active).length) },
    {
      label: "Ort. Paket Fiyatı",
      value:
        activePackages.length > 0
          ? formatCurrency(
              activePackages.reduce((s, p) => s + Number(p.price), 0) /
                activePackages.length
            )
          : "—",
    },
    {
      label: "En Yüksek Paket",
      value:
        activePackages.length > 0
          ? formatCurrency(Math.max(...activePackages.map((p) => Number(p.price))))
          : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Paket Fiyat Dağılımı</CardTitle>
          <CardDescription>Aktif paketlerin fiyat karşılaştırması</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Rapor için aktif paket gerekli
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => `₺${v}`}
                  className="text-xs fill-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="price" fill="var(--color-price)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
