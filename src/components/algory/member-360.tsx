"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  History,
  Loader2,
  Pin,
  PinOff,
  Plus,
  StickyNote,
  Tag,
  Trash2,
  X,
  Palette,
  ShieldCheck,
} from "lucide-react";
import {
  addMemberNote,
  createMemberGrant,
  deleteMemberNote,
  getMemberOverview,
  listAllTags,
  listGrantableProducts,
  listMemberGrants,
  listMemberNotes,
  revokeMemberGrant,
  setMemberTags,
  updateMemberNote,
  type GrantableProduct,
  type MemberActivity,
  type MemberGrant,
  type MemberNote,
  type MemberOverview,
  type TagCount,
} from "@/lib/api/members";
import type { BillingStanding } from "@/lib/api/types";
import { COLLECTION_STATUS_META } from "@/lib/labels/collection";
import { canWrite } from "@/lib/auth/permissions";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberThemes } from "./member-themes";
import { MemberRights } from "./member-rights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STANDING_META: Record<
  BillingStanding,
  { label: string; className: string }
> = {
  PAID: {
    label: "Ödemesi güncel",
    className: "text-emerald-700 dark:text-emerald-300",
  },
  DUE_SOON: {
    label: "Ödemesi yaklaşıyor",
    className: "text-amber-700 dark:text-amber-300",
  },
  OVERDUE: { label: "Gecikmede", className: "text-destructive" },
  LAPSED: { label: "Paketi bitmiş", className: "text-muted-foreground" },
};

const ACTIVITY_LABEL: Record<MemberActivity["kind"], string> = {
  PURCHASE: "Paket ödemesi",
  ADDON: "Ek ürün",
  REFUND: "İade",
  GRANT: "Hediye verildi",
  GRANT_REVOKED: "Hediye geri alındı",
  NOTE: "Not",
  ADMIN: "Yönetici işlemi",
};

const ACTIVITY_DOT: Record<MemberActivity["kind"], string> = {
  PURCHASE: "bg-emerald-500",
  ADDON: "bg-emerald-400",
  REFUND: "bg-destructive",
  GRANT: "bg-violet-500",
  GRANT_REVOKED: "bg-muted-foreground",
  NOTE: "bg-sky-500",
  ADMIN: "bg-border",
};

function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function money(amount: number | null | undefined, currency = "TRY") {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function dateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function date(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

/** Overview, tags, notes, grants and timeline for one member. */
export function Member360({ userId }: { userId: number }) {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: MemberOverview;
    error?: string;
  } | null>(null);
  // Keep the previous overview on screen while a refresh is in flight.
  const overview = result?.data;
  const error =
    result?.key === `${userId}:${version}` ? result.error : undefined;

  useEffect(() => {
    let cancelled = false;
    getMemberOverview(userId)
      .then((data) => {
        if (!cancelled) setResult({ key: `${userId}:${version}`, data });
      })
      .catch((err) => {
        if (!cancelled)
          setResult({
            key: `${userId}:${version}`,
            error: errorText(err, "Özet alınamadı."),
          });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const refresh = () => setVersion((v) => v + 1);
  const role = user?.adminRole;

  if (error && !overview) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SummaryStrip overview={overview} />
      <TagEditor
        userId={userId}
        tags={overview?.tags}
        editable={canWrite(role, "members")}
        onSaved={refresh}
      />
      <Tabs defaultValue="activity" className="gap-3">
        <TabsList className="flex-wrap">
          <TabsTrigger value="activity">
            <History className="size-3.5" />
            Zaman çizelgesi
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="size-3.5" />
            Notlar{overview?.noteCount ? ` (${overview.noteCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="rights">
            <ShieldCheck className="size-3.5" />
            Haklar
          </TabsTrigger>
          <TabsTrigger value="grants">
            <Gift className="size-3.5" />
            Hediyeler
            {overview?.activeGrants ? ` (${overview.activeGrants})` : ""}
          </TabsTrigger>
          <TabsTrigger value="themes">
            <Palette className="size-3.5" />
            Temalar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <ActivityList items={overview?.activity} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesPanel
            userId={userId}
            editable={canWrite(role, "members")}
            onChanged={refresh}
          />
        </TabsContent>
        <TabsContent value="rights">
          <MemberRights userId={userId} />
        </TabsContent>
        <TabsContent value="grants">
          <GrantsPanel
            userId={userId}
            editable={canWrite(role, "money")}
            onChanged={refresh}
          />
        </TabsContent>
        <TabsContent value="themes">
          <MemberThemes userId={userId} editable={canWrite(role, "content")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryStrip({ overview }: { overview?: MemberOverview }) {
  if (!overview) {
    return <Skeleton className="h-[74px] w-full" />;
  }
  const standing = overview.standing ? STANDING_META[overview.standing] : null;
  const collection = overview.collectionStatus
    ? COLLECTION_STATUS_META[overview.collectionStatus]
    : null;
  return (
    <Card className="border-border/60 bg-card/50">
      <CardContent className="grid grid-cols-2 gap-4 py-3 sm:grid-cols-4">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Ödeme durumu</div>
          <div
            className={cn("mt-0.5 text-sm font-medium", standing?.className)}
          >
            {standing?.label ?? "Ücretli paketi yok"}
          </div>
          {overview.periodEndsAt ? (
            <div className="truncate text-xs text-muted-foreground">
              {overview.packageName} · {date(overview.periodEndsAt)}
              {overview.daysUntilDue != null && overview.daysUntilDue >= 0
                ? ` (${overview.daysUntilDue} gün)`
                : ""}
            </div>
          ) : null}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Toplam ödeme</div>
          <div className="mt-0.5 text-sm font-medium tabular-nums">
            {money(overview.totalPaid, overview.currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            {overview.paidPurchases} ödeme
            {overview.totalRefunded > 0
              ? ` · ${money(overview.totalRefunded, overview.currency)} iade`
              : ""}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Müşteri süresi</div>
          <div className="mt-0.5 text-sm font-medium">
            {overview.firstPaidAt
              ? `${date(overview.firstPaidAt)}'den beri`
              : "Hiç ödemedi"}
          </div>
          <div className="text-xs text-muted-foreground">
            Son ödeme {date(overview.lastPaidAt)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Tahsilat</div>
          <div className="mt-0.5">
            {collection ? (
              <Badge variant="outline" className={collection.className}>
                {collection.label}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                Açık dosya yok
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TagEditor({
  userId,
  tags,
  editable,
  onSaved,
}: {
  userId: number;
  tags?: string[];
  editable: boolean;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [known, setKnown] = useState<TagCount[]>([]);

  useEffect(() => {
    if (!editable) return;
    let cancelled = false;
    listAllTags()
      .then((data) => {
        if (!cancelled) setKnown(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [editable]);

  async function save(next: string[]) {
    setBusy(true);
    setError(null);
    try {
      await setMemberTags(userId, next);
      setDraft("");
      onSaved();
    } catch (err) {
      setError(errorText(err, "Etiketler kaydedilemedi."));
    } finally {
      setBusy(false);
    }
  }

  const current = tags ?? [];
  const suggestions = known
    .map((t) => t.tag)
    .filter(
      (t) =>
        !current.includes(t) && (!draft || t.startsWith(draft.toLowerCase())),
    )
    .slice(0, 6);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag className="size-3.5 text-muted-foreground" />
      {tags == null ? (
        <Skeleton className="h-5 w-24" />
      ) : current.length === 0 && !editable ? (
        <span className="text-xs text-muted-foreground">Etiket yok</span>
      ) : null}
      {current.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          {editable ? (
            <button
              type="button"
              aria-label={`${tag} etiketini kaldır`}
              disabled={busy}
              onClick={() => save(current.filter((t) => t !== tag))}
              className="rounded-sm opacity-60 hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </Badge>
      ))}
      {editable && tags != null ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            const value = draft.trim();
            if (value) save([...current, value]);
          }}
        >
          <Input
            aria-label="Etiket ekle"
            placeholder="etiket ekle"
            list={`member-tags-${userId}`}
            className="h-6 w-28 px-2 text-xs"
            maxLength={40}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
          />
          <datalist id={`member-tags-${userId}`}>
            {suggestions.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          {busy ? (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          ) : null}
        </form>
      ) : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

function ActivityList({ items }: { items?: MemberActivity[] }) {
  if (!items) return <Skeleton className="h-40 w-full" />;
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Henüz hareket yok.
      </p>
    );
  }
  return (
    <ol className="space-y-3 border-l border-border/60 pl-4">
      {items.map((item, i) => (
        <li key={`${item.at}-${i}`} className="relative">
          <span
            className={cn(
              "absolute top-1.5 -left-[21px] size-2 rounded-full",
              ACTIVITY_DOT[item.kind],
            )}
          />
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{dateTime(item.at)}</span>
            <span>·</span>
            <span>{ACTIVITY_LABEL[item.kind]}</span>
            {item.actor ? (
              <>
                <span>·</span>
                <span>{item.actor}</span>
              </>
            ) : null}
          </div>
          <div className="mt-0.5 text-sm">
            <span
              className={
                item.kind === "ADMIN" ? "font-mono text-xs" : undefined
              }
            >
              {item.title}
            </span>
            {item.detail ? (
              <span className="text-muted-foreground"> · {item.detail}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function NotesPanel({
  userId,
  editable,
  onChanged,
}: {
  userId: number;
  editable: boolean;
  onChanged: () => void;
}) {
  const [notes, setNotes] = useState<MemberNote[] | null>(null);
  const [version, setVersion] = useState(0);
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMemberNotes(userId)
      .then((data) => {
        if (!cancelled) setNotes(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Notlar alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setVersion((v) => v + 1);
      onChanged();
    } catch (err) {
      setError(errorText(err, "Kaydedilemedi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {editable ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await addMemberNote(userId, body.trim(), pinned);
              setBody("");
              setPinned(false);
            });
          }}
        >
          <Textarea
            aria-label="Yeni not"
            rows={2}
            maxLength={4000}
            placeholder="Sadece yöneticiler görür. Örn. aradım, kurumsal fatura istiyor."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="size-3.5"
              />
              Üste sabitle
            </label>
            <Button type="submit" size="sm" disabled={busy || !body.trim()}>
              {busy ? <Loader2 className="animate-spin" /> : <Plus />}
              Not ekle
            </Button>
          </div>
        </form>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!notes ? (
        error ? null : (
          <Skeleton className="h-16 w-full" />
        )
      ) : notes.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Not yok.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className={cn(
                "rounded-lg border border-border/60 p-3",
                note.pinned && "border-amber-500/40 bg-amber-500/5",
              )}
            >
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 text-sm whitespace-pre-wrap">
                  {note.body}
                </p>
                {editable ? (
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={
                        note.pinned ? "Sabitlemeyi kaldır" : "Üste sabitle"
                      }
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          updateMemberNote(userId, note.id, {
                            pinned: !note.pinned,
                          }),
                        )
                      }
                    >
                      {note.pinned ? <PinOff /> : <Pin />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Notu sil"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("Not silinsin mi?"))
                          run(() => deleteMemberNote(userId, note.id));
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {note.authorName ?? "—"} · {dateTime(note.createdAt)}
                {note.pinned ? " · sabit" : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DAY_OPTIONS = [7, 14, 30, 90, 365];

function GrantsPanel({
  userId,
  editable,
  onChanged,
}: {
  userId: number;
  editable: boolean;
  onChanged: () => void;
}) {
  const [grants, setGrants] = useState<MemberGrant[] | null>(null);
  const [products, setProducts] = useState<GrantableProduct[]>([]);
  const [version, setVersion] = useState(0);
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMemberGrants(userId)
      .then((data) => {
        if (!cancelled) setGrants(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Hediyeler alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  useEffect(() => {
    if (!editable) return;
    let cancelled = false;
    listGrantableProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [editable]);

  const product = products.find((p) => String(p.id) === productId);
  const isCredit =
    product != null &&
    product.consumable &&
    product.billingType !== "RECURRING";
  // "Until used" only exists for credits; modules fall back to 30 days.
  const effectiveDays = days === "none" && !isCredit ? "30" : days;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setVersion((v) => v + 1);
      onChanged();
    } catch (err) {
      setError(errorText(err, "Kaydedilemedi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {editable ? (
        <form
          className="space-y-2 rounded-lg border border-border/60 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!product) return;
            run(async () => {
              await createMemberGrant(userId, {
                productId: product.id,
                quantity: Math.max(1, Number(quantity) || 1),
                days: effectiveDays === "none" ? null : Number(effectiveDays),
                reason: reason.trim(),
              });
              setReason("");
            });
          }}
        >
          <p className="text-xs text-muted-foreground">
            Ücretsiz modül veya kredi ver. Ödeme alınmaz; erişim hemen açılır,
            süre bitince kapanır.
          </p>
          <div className="grid gap-2 sm:grid-cols-[1fr_90px_140px]">
            <div className="space-y-1">
              <Label htmlFor="grant-product" className="text-xs">
                Ürün
              </Label>
              <Select
                value={productId || null}
                onValueChange={(v) => setProductId(v ?? "")}
              >
                <SelectTrigger id="grant-product" className="w-full">
                  <SelectValue>{product ? product.name : "Seç"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {p.code}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="grant-qty" className="text-xs">
                Adet
              </Label>
              <Input
                id="grant-qty"
                type="number"
                min={1}
                max={10000}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="grant-days" className="text-xs">
                Süre
              </Label>
              <Select
                value={effectiveDays}
                onValueChange={(v) => v && setDays(v)}
              >
                <SelectTrigger id="grant-days" className="w-full">
                  <SelectValue>
                    {effectiveDays === "none"
                      ? "Kullanılana kadar"
                      : `${effectiveDays} gün`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} gün
                    </SelectItem>
                  ))}
                  {isCredit ? (
                    <SelectItem value="none">Kullanılana kadar</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="grant-reason" className="text-xs">
                Neden
              </Label>
              <Input
                id="grant-reason"
                maxLength={1000}
                placeholder="Örn. kesinti telafisi, kampanya, deneme uzatma"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={busy || !product || !reason.trim()}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Gift />}
              Hediye et
            </Button>
          </div>
        </form>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!grants ? (
        error ? null : (
          <Skeleton className="h-16 w-full" />
        )
      ) : grants.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Bu üyeye hediye verilmemiş.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {grants.map((g) => (
            <li key={g.id} className="flex items-start gap-3 p-3">
              <Gift
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  g.active ? "text-violet-500" : "text-muted-foreground",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">
                    {g.productName} × {g.quantity}
                  </span>
                  {g.revokedAt ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      Geri alındı
                    </Badge>
                  ) : g.active ? (
                    <Badge
                      variant="outline"
                      className="border-violet-500/30 text-violet-700 dark:text-violet-300"
                    >
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Süresi doldu
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {g.reason} · {g.grantedBy} · {date(g.createdAt)} ·{" "}
                  {g.expiresAt
                    ? `bitiş ${date(g.expiresAt)}`
                    : "kullanılana kadar"}
                  {g.revokedAt
                    ? ` · ${g.revokedBy} geri aldı ${date(g.revokedAt)}`
                    : ""}
                </div>
              </div>
              {editable && g.active ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `${g.productName} hediyesi geri alınsın mı?`,
                      )
                    )
                      run(() => revokeMemberGrant(userId, g.id));
                  }}
                >
                  Geri al
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
