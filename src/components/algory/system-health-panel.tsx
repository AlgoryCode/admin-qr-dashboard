"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  getSystemHealth,
  type HealthStatus,
  type SystemHealth,
} from "@/lib/api/system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS: Record<
  HealthStatus,
  { label: string; dot: string; badge: string }
> = {
  UP: {
    label: "Çalışıyor",
    dot: "bg-emerald-500",
    badge: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  },
  WARN: {
    label: "Dikkat",
    dot: "bg-amber-500",
    badge: "border-amber-500/30 text-amber-700 dark:text-amber-300",
  },
  DOWN: {
    label: "Sorun var",
    dot: "bg-destructive",
    badge: "border-destructive/40 text-destructive",
  },
};

const JOB_LABEL: Record<string, string> = {
  "billing-reminders": "Ödeme hatırlatmaları",
  "catalog-schedule": "Kampanya ve fiyat planı",
  "invoice-issue": "Fatura kesimi",
  "subscription-lifecycle": "Abonelik yenileme",
  "payment-outbox": "Ödeme olayları",
  "fulfillment-repair": "Modül teslim onarımı",
  "card-verification-refund": "Kart doğrulama iadesi",
};

function ago(value: string | null) {
  if (!value) return "hiç";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} sa önce`;
  return `${Math.round(minutes / 1440)} gün önce`;
}

export function SystemHealthPanel() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getSystemHealth()
      .then((h) => {
        if (!cancelled) {
          setData(h);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Durum alınamadı.");
      });
    const timer = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tick]);

  if (error && !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (!data) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2.5 rounded-full", STATUS[data.overall].dot)}
          />
          <span className="font-medium">{STATUS[data.overall].label}</span>
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("tr-TR", { timeStyle: "medium" }).format(
              new Date(data.checkedAt),
            )}{" "}
            · 30 sn&apos;de bir yenilenir
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTick((n) => n + 1)}
        >
          <RefreshCw />
          Yenile
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {data.checks.map((c) => (
          <Card key={c.name} className="border-border/60 bg-card/50">
            <CardContent className="space-y-1 py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{c.name}</span>
                <Badge variant="outline" className={STATUS[c.status].badge}>
                  {STATUS[c.status].label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{c.detail}</p>
              {c.latencyMs != null ? (
                <p className="text-xs text-muted-foreground">
                  {c.latencyMs} ms
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Bekleyen işler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.backlogs.map((b) => (
              <div
                key={b.key}
                className="flex items-center justify-between text-sm"
              >
                <span>{b.label}</span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    b.count > 0 && b.severity === "bad" && "text-destructive",
                    b.count > 0 &&
                      b.severity === "warn" &&
                      "text-amber-700 dark:text-amber-300",
                    b.count === 0 && "text-muted-foreground",
                  )}
                >
                  {b.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Zamanlanmış işler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.jobs.map((j) => (
              <div
                key={j.name}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate" title={j.name}>
                  {JOB_LABEL[j.name] ?? j.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {j.running ? (
                    <span className="text-sky-700 dark:text-sky-300">
                      çalışıyor ·{" "}
                    </span>
                  ) : null}
                  {ago(j.lastStartedAt)}
                  {j.lockedBy ? ` · ${j.lockedBy}` : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Sunucu</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Çalışma süresi", data.runtime.uptime],
              [
                "Bellek",
                `${data.runtime.heapUsedMb} / ${data.runtime.heapMaxMb} MB`,
              ],
              ["İşlemci", data.runtime.processors],
              ["Java", data.runtime.java],
              ["Profil", data.runtime.profiles],
              ["Sunucu", data.runtime.instance],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="truncate">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
