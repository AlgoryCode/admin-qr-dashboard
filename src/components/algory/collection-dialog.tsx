"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getCollection,
  openCollection,
  recordCollectionEvent,
} from "@/lib/api/billing";
import type {
  BillingAccountRow,
  CollectionCaseResponse,
  CollectionStatus,
} from "@/lib/api/types";
import {
  COLLECTION_STATUS_META,
  COLLECTION_STATUS_ORDER,
} from "@/lib/labels/collection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { canWrite } from "@/lib/auth/permissions";
import { ReminderBlock } from "./reminder-block";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "TRY",
    }).format(amount);
  } catch {
    return `${amount} ${currency ?? ""}`.trim();
  }
}

function daysSince(value?: string | null) {
  if (!value) return null;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

export function CollectionStatusBadge({
  status,
}: {
  status: CollectionStatus;
}) {
  const meta = COLLECTION_STATUS_META[status];
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}

type Props = {
  account: BillingAccountRow | null;
  onOpenChange: (open: boolean) => void;
  /** Called after any change so the list can refresh. */
  onChanged: () => void;
};

export function CollectionDialog({ account, onOpenChange, onChanged }: Props) {
  const { user } = useAuth();
  const caseId = account?.collectionCaseId ?? null;
  const [loaded, setLoaded] = useState<{
    id: number;
    data: CollectionCaseResponse;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<CollectionStatus | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const collection = loaded && loaded.id === caseId ? loaded.data : null;
  const loading = caseId != null && !collection && !loadError;

  useEffect(() => {
    if (caseId == null) return;
    let cancelled = false;
    getCollection(caseId)
      .then((data) => {
        if (!cancelled) setLoaded({ id: caseId, data });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setLoadError(
            err instanceof Error ? err.message : "Dosya yüklenemedi.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  function reset() {
    setStatus("");
    setNote("");
    setSaveError(null);
    setLoadError(null);
  }

  async function save() {
    if (!account) return;
    setSaving(true);
    setSaveError(null);
    try {
      let updated: CollectionCaseResponse;
      if (collection) {
        updated = await recordCollectionEvent(collection.id, {
          status: status && status !== collection.status ? status : undefined,
          note,
        });
      } else {
        const opened = await openCollection(account.merchantId, note);
        updated =
          status && status !== opened.status
            ? await recordCollectionEvent(opened.id, { status })
            : opened;
      }
      setLoaded({ id: updated.id, data: updated });
      setStatus("");
      setNote("");
      onChanged();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  const statusChanged = status !== "" && status !== collection?.status;
  const canSave = collection ? statusChanged || note.trim().length > 0 : true;
  const overdueDays = daysSince(collection?.dueSince);
  const selectedMeta = status ? COLLECTION_STATUS_META[status] : null;

  return (
    <Dialog
      open={account != null}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tahsilat takibi</DialogTitle>
          <DialogDescription>
            {account?.merchantName ||
              account?.email ||
              `Üye #${account?.merchantId}`}
            {account?.packageName ? ` · ${account.packageName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loadError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {loading ? <Skeleton className="h-28 w-full" /> : null}

        {collection ? (
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 p-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Durum</div>
              <div className="mt-1">
                <CollectionStatusBadge status={collection.status} />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Borç</div>
              <div className="mt-1 font-medium tabular-nums">
                {formatMoney(collection.amount, collection.currency)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Vade</div>
              <div className="mt-1">
                {formatDateTime(collection.dueSince)}
                {overdueDays != null &&
                overdueDays > 0 &&
                !collection.closedAt ? (
                  <span className="ml-1 text-xs text-destructive">
                    ({overdueDays} gün gecikme)
                  </span>
                ) : null}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                {collection.closedAt ? "Kapandı" : "Açıldı"}
              </div>
              <div className="mt-1">
                {formatDateTime(collection.closedAt ?? collection.openedAt)}
              </div>
            </div>
          </div>
        ) : null}

        {account ? (
          <ReminderBlock
            merchantId={account.merchantId}
            canSend={canWrite(user?.adminRole, "collections")}
            onSent={onChanged}
          />
        ) : null}

        {!loading && !collection && !loadError ? (
          <p className="text-sm text-muted-foreground">
            Bu üye için açık tahsilat dosyası yok. Kaydettiğinde dosya
            &quot;Ödeme bekleniyor&quot; olarak açılır; istersen doğrudan başka
            bir durum seçebilirsin.
          </p>
        ) : null}

        {!loading && !loadError ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="collection-status">
                {collection ? "Yeni durum" : "Başlangıç durumu"}
              </Label>
              <Select
                value={status || null}
                onValueChange={(v) => setStatus((v as CollectionStatus) ?? "")}
              >
                <SelectTrigger id="collection-status" className="w-full">
                  <SelectValue>
                    {status
                      ? COLLECTION_STATUS_META[status].label
                      : collection
                        ? "Değiştirme (sadece not ekle)"
                        : COLLECTION_STATUS_META.AWAITING_PAYMENT.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_STATUS_ORDER.map((key) => (
                    <SelectItem
                      key={key}
                      value={key}
                      disabled={key === collection?.status}
                    >
                      {COLLECTION_STATUS_META[key].label}
                      {COLLECTION_STATUS_META[key].closed
                        ? " · dosyayı kapatır"
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMeta ? (
                <p className="text-xs text-muted-foreground">
                  {selectedMeta.hint}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="collection-note">Not</Label>
              <Textarea
                id="collection-note"
                rows={3}
                maxLength={2000}
                placeholder="Örn. arandı, cuma günü ödeyeceğini söyledi · ihtarname no · icra dosya no"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
          </div>
        ) : null}

        {collection && collection.events.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Geçmiş
            </div>
            <ol className="space-y-3 border-l border-border/60 pl-4">
              {[...collection.events].reverse().map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-border" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDateTime(event.createdAt)}</span>
                    <span>·</span>
                    <span>
                      {event.actor === "system" ? "Sistem" : event.actor}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    {event.fromStatus === event.toStatus ? (
                      <span className="text-muted-foreground">Not eklendi</span>
                    ) : (
                      <span>
                        {event.fromStatus
                          ? `${COLLECTION_STATUS_META[event.fromStatus].label} → `
                          : "Dosya açıldı: "}
                        <span className="font-medium">
                          {COLLECTION_STATUS_META[event.toStatus].label}
                        </span>
                      </span>
                    )}
                  </div>
                  {event.note ? (
                    <p className="mt-0.5 text-sm whitespace-pre-wrap text-muted-foreground">
                      {event.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Kapat
          </Button>
          <Button
            onClick={save}
            disabled={saving || loading || !!loadError || !canSave}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            {collection ? "Kaydet" : "Takibi başlat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
