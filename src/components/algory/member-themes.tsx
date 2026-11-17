"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  listMemberThemes,
  listThemeCatalog,
  replaceMemberThemes,
  type MenuTheme,
} from "@/lib/api/members";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function swatch(theme: MenuTheme): string[] {
  const raw = theme.previewMeta?.swatch;
  if (Array.isArray(raw)) return raw.slice(0, 4);
  return typeof raw === "string" ? [raw] : [];
}

/** Which menu themes the member may pick, on top of what their package includes. */
export function MemberThemes({
  userId,
  editable,
}: {
  userId: number;
  editable: boolean;
}) {
  const [catalog, setCatalog] = useState<MenuTheme[] | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([listThemeCatalog(), listMemberThemes(userId)])
      .then(([all, mine]) => {
        if (cancelled) return;
        const codes = mine.map((t) => t.code);
        setCatalog(all);
        setSaved(codes);
        setDraft(codes);
      })
      .catch((err) => {
        if (!cancelled) {
          setCatalog([]);
          setMessage({
            ok: false,
            text: err instanceof Error ? err.message : "Temalar alınamadı.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const dirty = [...draft].sort().join() !== [...saved].sort().join();

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await replaceMemberThemes(userId, draft);
      const codes = result.map((t) => t.code);
      setSaved(codes);
      setDraft(codes);
      setMessage({ ok: true, text: "Temalar güncellendi." });
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : "Kaydedilemedi.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (catalog == null) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        İşaretli temalar bu üyeye ayrıca açılır. {saved.length} tema atanmış.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((theme) => {
          const on = draft.includes(theme.code);
          return (
            <button
              key={theme.code}
              type="button"
              disabled={!editable}
              onClick={() =>
                setDraft((d) =>
                  on ? d.filter((c) => c !== theme.code) : [...d, theme.code],
                )
              }
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                on
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:bg-muted/40",
                !theme.active && "opacity-60",
              )}
            >
              <span className="flex shrink-0 overflow-hidden rounded-md border border-border/60">
                {(swatch(theme).length ? swatch(theme) : ["var(--muted)"]).map(
                  (c, i) => (
                    <span
                      key={i}
                      className="block h-8 w-3"
                      style={{ background: c }}
                    />
                  ),
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {theme.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {theme.code}
                  {!theme.active ? " · pasif" : ""}
                </span>
              </span>
              {on ? <Check className="size-4 text-primary" /> : null}
            </button>
          );
        })}
      </div>
      {message ? (
        <p
          className={
            message.ok
              ? "text-xs text-emerald-700 dark:text-emerald-300"
              : "text-xs text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}
      {editable ? (
        <div className="flex gap-2">
          <Button size="sm" disabled={!dirty || busy} onClick={save}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            Kaydet
          </Button>
          {dirty ? (
            <Button size="sm" variant="ghost" onClick={() => setDraft(saved)}>
              Vazgeç
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
