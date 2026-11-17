"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { getRevenue, type RevenueSummary } from "@/lib/api/finance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterSelect } from "./list-toolbar";
import { ExportButton } from "./export-button";

const chartConfig = {
  net: { label: "Net tahsilat", color: "var(--chart-2)" },
  mrr: { label: "MRR", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function money(amount: number | null | undefined, currency = "TRY") {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 10_000 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    month: "short",
    year: "2-digit",
  }).format(new Date(y, m - 1, 1));
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "bad";
}) {
  return (
    <Card className="border-border/60 bg-card/50">
      <CardContent className="space-y-1 py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={
            tone === "bad"
              ? "text-xl font-semibold tabular-nums text-destructive"
              : "text-xl font-semibold tabular-nums"
          }
        >
          {value}
        </div>
        {hint ? (
          <div className="text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

const RANGES = [
  { value: "6", label: "Son 6 ay" },
  { value: "12", label: "Son 12 ay" },
  { value: "24", label: "Son 24 ay" },
];

export function RevenuePanel() {
  const [months, setMonths] = useState("12");
  const [result, setResult] = useState<{
    for: string;
    data?: RevenueSummary;
    error?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRevenue(Number(months))
      .then((data) => {
        if (!cancelled) setResult({ for: months, data });
      })
      .catch((err) => {
        if (!cancelled)
          setResult({
            for: months,
            error:
              err instanceof Error ? err.message : "Gelir verisi alınamadı.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [months]);

  const data = result?.data;
  const cur = data?.currency ?? "TRY";
  const thisMonth = data?.months.at(-1);

  if (result?.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {result.error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-[88px]" />
          ))}
        </div>
        <Skeleton className="h-[320px]" />
      </div>
    );
  }

  const chartData = data.months.map((m) => ({
    ...m,
    label: monthLabel(m.month),
  }));
  const totalMrr = data.byPackage.reduce((s, p) => s + p.mrr, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="MRR (aylık yinelenen gelir)"
          value={money(data.mrr, cur)}
          hint={`ARR ${money(data.arr, cur)}`}
        />
        <Kpi
          label="Ödeyen müşteri"
          value={String(data.activeCustomers)}
          hint={`Müşteri başı ${money(data.arpa, cur)} / ay`}
        />
        <Kpi
          label="Bu ay tahsil edilen"
          value={money(thisMonth?.net, cur)}
          hint={`${thisMonth?.payments ?? 0} ödeme${thisMonth?.refunded ? ` · ${money(thisMonth.refunded, cur)} iade` : ""}`}
        />
        <Kpi
          label="Geçen ay kayıp oranı"
          value={
            data.churnRateLastMonth == null
              ? "—"
              : `%${data.churnRateLastMonth.toLocaleString("tr-TR")}`
          }
          hint={
            data.churnRateLastMonth == null
              ? "Yeterli veri yok"
              : "Ay başındaki müşterilere göre"
          }
        />
        <Kpi
          label="30 gün içinde yenilenecek"
          value={money(data.dueNext30Days, cur)}
          hint={`${data.dueNext30Count} üye`}
        />
        <Kpi
          label="Geciken"
          value={money(data.overdueAmount, cur)}
          hint={`${data.overdueCount} üye`}
          tone={data.overdueCount > 0 ? "bad" : undefined}
        />
        <Kpi
          label="Bu ay yeni müşteri"
          value={String(thisMonth?.newCustomers ?? 0)}
        />
        <Kpi label="Bu ay kaybedilen" value={String(thisMonth?.churned ?? 0)} />
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Aylık gelir</CardTitle>
            <CardDescription>
              Çubuk: iadeler düşülmüş tahsilat · çizgi: ay sonundaki MRR
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <FilterSelect
              label="Dönem"
              value={months}
              defaultValue="12"
              options={RANGES}
              onChange={setMonths}
            />
            <ExportButton kind="revenue" label="CSV" />
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-border/40"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) =>
                  new Intl.NumberFormat("tr-TR", {
                    notation: "compact",
                  }).format(v)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]
                            ?.label ?? name}
                        </span>
                        <span className="font-medium tabular-nums">
                          {money(Number(value), cur)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="net"
                fill="var(--color-net)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                dataKey="mrr"
                stroke="var(--color-mrr)"
                strokeWidth={2}
                dot={false}
                type="linear"
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Pakete göre MRR</CardTitle>
            <CardDescription>Şu an ödeyen müşteriler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byPackage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ödeyen müşteri yok.
              </p>
            ) : (
              data.byPackage.map((p) => {
                const share = totalMrr > 0 ? (p.mrr / totalMrr) * 100 : 0;
                return (
                  <div key={p.packageName} className="space-y-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="font-medium">{p.packageName}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {p.customers} müşteri · {money(p.mrr, cur)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[var(--chart-2)]"
                        style={{ width: `${Math.max(share, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Müşteri hareketi</CardTitle>
            <CardDescription>
              Ay ay yeni gelen ve ayrılan ödeyen müşteriler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left font-normal">Ay</th>
                    <th className="py-1 text-right font-normal">Ay başı</th>
                    <th className="py-1 text-right font-normal">Yeni</th>
                    <th className="py-1 text-right font-normal">Kayıp</th>
                    <th className="py-1 text-right font-normal">
                      Net tahsilat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.months]
                    .reverse()
                    .slice(0, 6)
                    .map((m) => (
                      <tr key={m.month} className="border-t border-border/40">
                        <td className="py-1.5">{monthLabel(m.month)}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {m.activeAtStart}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300">
                          {m.newCustomers ? `+${m.newCustomers}` : "0"}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-destructive">
                          {m.churned ? `−${m.churned}` : "0"}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {money(m.net, cur)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
