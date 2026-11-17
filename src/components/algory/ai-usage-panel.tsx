"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getAiUsage, type AiUsage } from "@/lib/api/system";
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

const chartConfig = {
  assistant: { label: "Asistan sorusu", color: "var(--chart-2)" },
  smartReports: { label: "Akıllı rapor", color: "var(--chart-4)" },
} satisfies ChartConfig;

const TOPIC_LABEL: Record<string, string> = {
  REVENUE: "Ciro",
  ORDERS: "Siparişler",
  PRODUCTS: "Ürünler",
  STAFF: "Personel",
  MENU: "Menü",
  GENERAL: "Genel",
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="border-border/60 bg-card/50">
      <CardContent className="space-y-1 py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        {hint ? (
          <div className="text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Bars({
  items,
  labels,
}: {
  items: { key: string; count: number }[];
  labels?: Record<string, string>;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">Kayıt yok.</p>;
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.key} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{labels?.[i.key] ?? i.key}</span>
            <span className="tabular-nums text-muted-foreground">
              {i.count}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--chart-2)]"
              style={{ width: `${(i.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AiUsagePanel() {
  const [days, setDays] = useState("30");
  const [result, setResult] = useState<{
    for: string;
    data?: AiUsage;
    error?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAiUsage(Number(days))
      .then((data) => {
        if (!cancelled) setResult({ for: days, data });
      })
      .catch((err) => {
        if (!cancelled)
          setResult({
            for: days,
            error: err instanceof Error ? err.message : "Kullanım alınamadı.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const data = result?.data;
  if (result?.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {result.error}
      </div>
    );
  }
  if (!data) return <Skeleton className="h-64 w-full" />;

  const money = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: data.costCurrency,
  });
  const answerRate =
    data.assistantQuestions > 0
      ? Math.round(
          ((data.assistantQuestions - data.assistantFailed) /
            data.assistantQuestions) *
            100,
        )
      : null;
  const chartData = data.series.map((d) => ({
    ...d,
    label: new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "short",
    }).format(new Date(d.day)),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Maliyet tahminidir: istek sayısı × birim fiyat (asistan{" "}
          {money.format(data.assistantUnitCost)}, rapor{" "}
          {money.format(data.smartReportUnitCost)}). Birim fiyatlar sunucu
          ayarından değişir.
        </p>
        <FilterSelect
          label="Dönem"
          value={days}
          defaultValue="30"
          options={[
            { value: "7", label: "Son 7 gün" },
            { value: "30", label: "Son 30 gün" },
            { value: "90", label: "Son 90 gün" },
          ]}
          onChange={setDays}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Tahmini maliyet"
          value={money.format(data.estimatedCost)}
          hint={`Son ${data.days} gün`}
        />
        <Stat
          label="Asistan soruları"
          value={
            data.assistantTracked
              ? data.assistantQuestions.toLocaleString("tr-TR")
              : "—"
          }
          hint={
            !data.assistantTracked
              ? "Bu veritabanında kayıt tablosu yok"
              : answerRate != null
                ? `%${answerRate} yanıtlandı`
                : undefined
          }
        />
        <Stat
          label="Ortalama yanıt süresi"
          value={
            data.assistantAvgMs != null
              ? `${(data.assistantAvgMs / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn`
              : "—"
          }
        />
        <Stat
          label="Akıllı raporlar"
          value={data.smartReports.toLocaleString("tr-TR")}
          hint={
            data.smartReportsFailed
              ? `${data.smartReportsFailed} başarısız`
              : undefined
          }
        />
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Günlük kullanım</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
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
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="assistant"
                stackId="a"
                fill="var(--color-assistant)"
              />
              <Bar
                dataKey="smartReports"
                stackId="a"
                fill="var(--color-smartReports)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Asistan konuları</CardTitle>
          </CardHeader>
          <CardContent>
            <Bars items={data.assistantTopics} labels={TOPIC_LABEL} />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Rapor hataları</CardTitle>
            <CardDescription>
              Başarısız akıllı raporların nedeni
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bars items={data.smartReportErrors} />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">En çok kullananlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.topMerchants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kayıt yok.</p>
            ) : (
              data.topMerchants.map((m) => (
                <div
                  key={m.merchantId}
                  className="flex justify-between gap-2 text-sm"
                >
                  <a
                    href={`/kullanicilar/${m.merchantId}`}
                    className="truncate hover:underline"
                  >
                    {m.name ?? `Üye #${m.merchantId}`}
                  </a>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {m.assistant} soru · {m.smartReports} rapor
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
