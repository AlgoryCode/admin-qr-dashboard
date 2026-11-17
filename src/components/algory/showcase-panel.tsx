"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import {
  BADGE_LABEL,
  listShowcase,
  saveShowcase,
  type ShowcaseBadge,
  type ShowcaseModule,
} from "@/lib/api/catalog-plans";
import { useAuth } from "@/context/auth-context";
import { canWrite } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { money } from "./revenue-panel";

const BADGES: (ShowcaseBadge | null)[] = [null, "NEW", "POPULAR", "DEAL"];

/** Module store presentation: tagline, badge, order, featured, hidden. */
export function ShowcasePanel() {
  const { user } = useAuth();
  const editable = canWrite(user?.adminRole, "money");
  const [rows, setRows] = useState<ShowcaseModule[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listShowcase()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Modüller alınamadı.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader>
        <CardTitle className="text-base">Modül vitrini</CardTitle>
        <CardDescription>
          Üyelerin “Modüller” sayfasında ek modüllerin nasıl görüneceği: kısa
          açıklama, rozet, sıra. Öne çıkanlar en üstte gösterilir; gizlenen
          modül satışta görünmez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {rows == null ? (
          <Skeleton className="h-32 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ayrı satılan modül yok. Ürünlerde “Ek modül olarak satılabilir”
            seçeneğini açın.
          </p>
        ) : (
          rows.map((row) => (
            <ShowcaseRow
              key={row.productId}
              row={row}
              editable={editable}
              onSaved={(saved) =>
                setRows(
                  (list) =>
                    list?.map((r) =>
                      r.productId === saved.productId ? saved : r,
                    ) ?? null,
                )
              }
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ShowcaseRow({
  row,
  editable,
  onSaved,
}: {
  row: ShowcaseModule;
  editable: boolean;
  onSaved: (row: ShowcaseModule) => void;
}) {
  const [draft, setDraft] = useState({
    tagline: row.tagline ?? "",
    badge: row.badge,
    featured: row.featured,
    hidden: row.hidden,
    sortOrder: String(row.sortOrder),
  });
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty =
    draft.tagline !== (row.tagline ?? "") ||
    draft.badge !== row.badge ||
    draft.featured !== row.featured ||
    draft.hidden !== row.hidden ||
    Number(draft.sortOrder) !== row.sortOrder;

  async function save() {
    setState("saving");
    setError(null);
    try {
      const saved = await saveShowcase(row.productId, {
        tagline: draft.tagline || null,
        badge: draft.badge,
        featured: draft.featured,
        hidden: draft.hidden,
        sortOrder: Math.max(0, Number(draft.sortOrder) || 0),
      });
      onSaved(saved);
      setState("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
      setState("idle");
    }
  }

  return (
    <div
      className={
        draft.hidden
          ? "space-y-2 rounded-lg border border-dashed border-border/60 p-3 opacity-70"
          : "space-y-2 rounded-lg border border-border/60 p-3"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {draft.featured ? (
            <Star className="size-4 fill-amber-400 text-amber-400" />
          ) : null}
          <span className="text-sm font-medium">{row.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.code} · {money(row.unitPrice)}
          </span>
          {!row.active ? <Badge variant="outline">Pasif</Badge> : null}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5">
            <Switch
              checked={draft.featured}
              disabled={!editable}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, featured: v }))}
            />
            Öne çıkar
          </label>
          <label className="flex items-center gap-1.5">
            <Switch
              checked={draft.hidden}
              disabled={!editable}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, hidden: v }))}
            />
            Gizle
          </label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={draft.tagline}
          maxLength={160}
          disabled={!editable}
          placeholder={row.description ?? "Kısa açıklama"}
          className="h-8 min-w-0 flex-1 basis-60"
          onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
        />
        <div className="flex items-center gap-1 rounded-lg border border-input p-0.5">
          {BADGES.map((b) => (
            <button
              key={b ?? "none"}
              type="button"
              disabled={!editable}
              onClick={() => setDraft((d) => ({ ...d, badge: b }))}
              className={
                draft.badge === b
                  ? "rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
                  : "rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/50"
              }
            >
              {b ? BADGE_LABEL[b] : "Rozet yok"}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min={0}
          aria-label="Sıra"
          title="Sıra (küçük olan önce)"
          disabled={!editable}
          className="h-8 w-20"
          value={draft.sortOrder}
          onChange={(e) =>
            setDraft((d) => ({ ...d, sortOrder: e.target.value }))
          }
        />
        {editable ? (
          <Button
            size="sm"
            variant={dirty ? "default" : "outline"}
            disabled={!dirty || state === "saving"}
            onClick={save}
          >
            {state === "saving" ? (
              <Loader2 className="animate-spin" />
            ) : state === "saved" && !dirty ? (
              <Check />
            ) : null}
            {state === "saved" && !dirty ? "Kaydedildi" : "Kaydet"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
