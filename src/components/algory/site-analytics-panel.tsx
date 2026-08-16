"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  DEFAULT_PAGE_SIZE,
  getSiteAnalyticsSummary,
  listSiteVisits,
  type SiteAnalyticsSummary,
  type SiteVisitItem,
} from "@/lib/api/site-analytics";
import { ApiError } from "@/lib/api/client";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dailyChartConfig = {
  count: {
    label: "Ziyaret",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const deviceChartConfig = {
  count: {
    label: "Ziyaret",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLocation(item: SiteVisitItem) {
  const parts = [item.city, item.regionName, item.countryName].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Bilinmiyor";
}

function deviceIcon(deviceType: string | null) {
  switch ((deviceType ?? "").toUpperCase()) {
    case "MOBILE":
      return Smartphone;
    case "TABLET":
      return Tablet;
    case "DESKTOP":
      return Monitor;
    default:
      return Globe;
  }
}

function deviceLabel(deviceType: string | null) {
  switch ((deviceType ?? "").toUpperCase()) {
    case "MOBILE":
      return "Mobil";
    case "TABLET":
      return "Tablet";
    case "DESKTOP":
      return "Masaüstü";
    default:
      return "Diğer";
  }
}

export function SiteAnalyticsPanel() {
  const [days, setDays] = useState("30");
  const [summary, setSummary] = useState<SiteAnalyticsSummary | null>(null);
  const [items, setItems] = useState<SiteVisitItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rangeDays = Number(days);

  const fetchData = useCallback(async (pageIndex: number, range: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryResult, visitsResult] = await Promise.all([
        getSiteAnalyticsSummary(range),
        listSiteVisits(pageIndex, DEFAULT_PAGE_SIZE, range),
      ]);
      setSummary(summaryResult);
      setItems(visitsResult.content);
      setPage(visitsResult.page);
      setTotalElements(visitsResult.totalElements);
      setTotalPages(visitsResult.totalPages);
      setHasNext(visitsResult.hasNext);
    } catch (err) {
      setSummary(null);
      setItems([]);
      setTotalElements(0);
      setTotalPages(0);
      setHasNext(false);

      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Site analitiği yüklenemedi.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, rangeDays);
  }, [fetchData, page, rangeDays]);

  const handleDaysChange = (value: string | null) => {
    if (!value) return;
    setDays(value);
    setPage(0);
  };

  if (isLoading && !summary) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const metrics = [
    { label: "Toplam Ziyaret", value: String(summary?.totalVisits ?? 0) },
    { label: "Ülke Sayısı", value: String(summary?.uniqueCountries ?? 0) },
    {
      label: "Mobil Oranı",
      value: formatShare(summary?.devices ?? [], "Mobil"),
    },
    {
      label: "Masaüstü Oranı",
      value: formatShare(summary?.devices ?? [], "Masaüstü"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Site Ziyaret Analitiği</h2>
          <p className="text-sm text-muted-foreground">
            AlgoryQR web sitesine giren ziyaretçilerin IP, cihaz ve konum bilgileri
          </p>
        </div>
        <Select value={days} onValueChange={handleDaysChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Dönem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Son 7 gün</SelectItem>
            <SelectItem value="30">Son 30 gün</SelectItem>
            <SelectItem value="90">Son 90 gün</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Günlük Ziyaretler</CardTitle>
            <CardDescription>Seçilen dönemdeki sayfa görüntülemeleri</CardDescription>
          </CardHeader>
          <CardContent>
            {(summary?.daily.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Henüz veri yok</p>
            ) : (
              <ChartContainer config={dailyChartConfig} className="aspect-[16/9] w-full">
                <BarChart data={summary?.daily ?? []}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })
                    }
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Ülkelere Göre</CardTitle>
            <CardDescription>En çok ziyaret eden ülkeler</CardDescription>
          </CardHeader>
          <CardContent>
            {(summary?.countries.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Henüz veri yok</p>
            ) : (
              <ChartContainer config={deviceChartConfig} className="aspect-[16/9] w-full">
                <BarChart data={summary?.countries ?? []} layout="vertical">
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={96}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Ziyaret Kayıtları</CardTitle>
          <CardDescription>
            {totalElements > 0
              ? `${totalElements} kayıt · Sayfa ${page + 1}/${Math.max(totalPages, 1)}`
              : "Kayıt bulunamadı"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Yükleniyor...
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Seçilen dönemde ziyaret kaydı yok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Sayfa</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Cihaz</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>Referrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const Icon = deviceIcon(item.deviceType);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate font-mono text-xs">
                          {item.path}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {item.ipAddress ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="size-3.5 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="truncate text-xs">{item.device ?? "—"}</p>
                              <Badge variant="outline" className="mt-0.5 text-[10px]">
                                {deviceLabel(item.deviceType)}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">
                          {formatLocation(item)}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {item.referrer ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0 || isLoading}
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext || isLoading}
                onClick={() => setPage((current) => current + 1)}
              >
                Sonraki
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatShare(devices: { name: string; count: number }[], label: string) {
  const total = devices.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return "—";
  const match = devices.find((item) => item.name === label);
  if (!match) return "0%";
  return `${Math.round((match.count / total) * 100)}%`;
}
