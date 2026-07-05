"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAlgoryData } from "@/context/algory-data-context";
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
  quantity: {
    label: "Ürün Miktarı",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function UserUsageChart() {
  const { packages, isLoading } = useAlgoryData();

  if (isLoading) {
    return (
      <Card className="border-border/60 bg-card/50 lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = packages.map((pkg) => ({
    name: pkg.code,
    quantity: pkg.items.reduce((s, i) => s + i.quantity, 0),
    price: Number(pkg.price),
  }));

  return (
    <Card className="border-border/60 bg-card/50 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Paket Kullanım Dağılımı</CardTitle>
        <CardDescription>Paketlerdeki toplam ürün miktarları</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Grafik için paket oluşturun
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-quantity)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-quantity)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                className="text-xs fill-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="quantity"
                stroke="var(--color-quantity)"
                fill="url(#fillQty)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
