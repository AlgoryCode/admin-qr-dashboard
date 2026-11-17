"use client";

import { useEffect, useState } from "react";
import {
  getMemberEntitlements,
  type EffectiveRight,
  type MemberEntitlements,
} from "@/lib/api/members";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<EffectiveRight["kind"], string> = {
  BOOLEAN: "Özellik",
  LIMIT: "Kapasite",
  METERED: "Dönemlik kota",
  CREDIT: "Kredi",
};

function amount(line: EffectiveRight) {
  if (line.kind === "BOOLEAN") return "Açık";
  if (line.unlimited) return "Sınırsız";
  return `${line.limit}${line.unit ? ` ${line.unit}` : ""}`;
}

/** Everything the member may use right now, summed over package, modules, add-ons and gifts. */
export function MemberRights({ userId }: { userId: number }) {
  const [data, setData] = useState<MemberEntitlements | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMemberEntitlements(userId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Haklar alınamadı.");
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }
  if (!data) return <Skeleton className="h-32 w-full" />;

  const sub = data.subscription;
  return (
    <div className="space-y-3">
      {sub ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{sub.packageCode ?? "Paket yok"}</Badge>
          {sub.planVersion ? (
            <span className="text-muted-foreground">
              sürüm v{sub.planVersion}
            </span>
          ) : null}
          <span className="text-muted-foreground">· durum {sub.status}</span>
          {sub.billingStatus ? (
            <span className="text-muted-foreground">
              · ödeme {sub.billingStatus}
            </span>
          ) : null}
          {sub.periodEnd ? (
            <span className="text-muted-foreground">
              · dönem sonu {new Date(sub.periodEnd).toLocaleDateString("tr-TR")}
            </span>
          ) : null}
          {sub.cancelAtPeriodEnd ? (
            <Badge variant="destructive">Dönem sonunda bitecek</Badge>
          ) : null}
        </div>
      ) : null}
      {data.lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Şu an kullanılabilir hak yok (paket kapalı ya da hiç verilmemiş).
        </p>
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          {data.lines.map((line) => {
            const over =
              line.used != null && !line.unlimited && line.used > line.limit;
            return (
              <div
                key={line.feature}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm"
              >
                <span className="font-medium">{line.name}</span>
                <span className="text-xs text-muted-foreground">
                  {KIND_LABEL[line.kind]}
                </span>
                <span className="ml-auto tabular-nums">
                  {line.used != null ? (
                    <span className={cn(over && "text-destructive")}>
                      {line.used} /{" "}
                    </span>
                  ) : null}
                  {amount(line)}
                </span>
                {line.grants > 1 ? (
                  <span className="w-full text-xs text-muted-foreground">
                    {line.grants} kaynaktan toplandı
                  </span>
                ) : null}
                {over ? (
                  <span className="w-full text-xs text-destructive">
                    Limitin üstünde: yeni kayıt ekleyemez.
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Hak sürümü {data.version}. Her paket, ek ürün veya hediye değişikliğinde
        artar.
      </p>
    </div>
  );
}
