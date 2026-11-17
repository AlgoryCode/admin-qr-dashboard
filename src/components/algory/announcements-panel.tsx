"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteAnnouncement,
  listAnnouncements,
  saveAnnouncement,
  type Announcement,
  type AnnouncementRequest,
  type Audience,
  type Tone,
} from "@/lib/api/content";
import { useAuth } from "@/context/auth-context";
import { canWrite } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TONES: Record<Tone, { label: string; className: string }> = {
  INFO: {
    label: "Bilgi",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  },
  SUCCESS: {
    label: "Yenilik",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  WARNING: {
    label: "Uyarı",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  },
};

const AUDIENCES: Record<Audience, string> = {
  ALL: "Tüm üyeler",
  PAYING: "Ücretli paketi olanlar",
  FREE: "Ücretsiz / paketsiz üyeler",
};

function when(value: string | null) {
  if (!value) return "süresiz";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toLocalInput(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

function nowInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The banner as members will see it. */
function BannerPreview({
  a,
}: {
  a: Pick<Announcement, "title" | "body" | "linkLabel" | "linkUrl" | "tone">;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm",
        TONES[a.tone].className,
      )}
    >
      <span className="font-medium">{a.title || "Başlık"}</span>
      {a.body ? <span className="opacity-90">{a.body}</span> : null}
      {a.linkUrl ? (
        <span className="font-medium underline underline-offset-2">
          {a.linkLabel || "Detay"}
        </span>
      ) : null}
    </div>
  );
}

export function AnnouncementsPanel() {
  const { user } = useAuth();
  const editable = canWrite(user?.adminRole, "content");
  const [rows, setRows] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAnnouncements()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Duyurular alınamadı.");
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function remove(a: Announcement) {
    if (!window.confirm(`"${a.title}" silinsin mi?`)) return;
    try {
      await deleteAnnouncement(a.id);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Üye panelinin üstünde görünen şerit. Aynı anda en fazla 3 duyuru
          gösterilir.
        </p>
        {editable ? (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus />
            Yeni duyuru
          </Button>
        ) : null}
      </div>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {rows == null ? (
        <Skeleton className="h-24 w-full" />
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
          Henüz duyuru yok.
        </p>
      ) : (
        rows.map((a) => (
          <div
            key={a.id}
            className="space-y-2 rounded-lg border border-border/60 p-3"
          >
            <BannerPreview a={a} />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {a.live ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                >
                  Yayında
                </Badge>
              ) : !a.active ? (
                <Badge variant="outline">Kapalı</Badge>
              ) : new Date(a.startsAt) > new Date() ? (
                <Badge
                  variant="outline"
                  className="border-sky-500/30 text-sky-700 dark:text-sky-300"
                >
                  Planlandı
                </Badge>
              ) : (
                <Badge variant="outline">Süresi doldu</Badge>
              )}
              <span>{AUDIENCES[a.audience]}</span>
              <span>·</span>
              <span>
                {when(a.startsAt)} – {when(a.endsAt)}
              </span>
              {editable ? (
                <span className="ml-auto flex gap-1">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setEditing(a)}
                  >
                    <Pencil />
                    Düzenle
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => remove(a)}
                  >
                    <Trash2 />
                    Sil
                  </Button>
                </span>
              ) : null}
            </div>
          </div>
        ))
      )}
      {editing ? (
        <AnnouncementDialog
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setReload((n) => n + 1);
          }}
        />
      ) : null}
    </div>
  );
}

function AnnouncementDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: Announcement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AnnouncementRequest>(() => ({
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    linkUrl: initial?.linkUrl ?? "",
    linkLabel: initial?.linkLabel ?? "",
    tone: initial?.tone ?? "INFO",
    audience: initial?.audience ?? "ALL",
    startsAt: toLocalInput(initial?.startsAt ?? null) || nowInput(),
    endsAt: toLocalInput(initial?.endsAt ?? null),
    dismissible: initial?.dismissible ?? true,
    active: initial?.active ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<AnnouncementRequest>) =>
    setForm((f) => ({ ...f, ...patch }));

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await saveAnnouncement(initial?.id ?? null, {
        ...form,
        startsAt: `${form.startsAt}:00`,
        endsAt: form.endsAt ? `${form.endsAt}:00` : null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Duyuruyu düzenle" : "Yeni duyuru"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <BannerPreview a={form} />
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Başlık</Label>
            <Input
              id="ann-title"
              maxLength={120}
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ann-body">Metin</Label>
            <Textarea
              id="ann-body"
              maxLength={600}
              rows={2}
              value={form.body ?? ""}
              onChange={(e) => set({ body: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-[1fr_9rem] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-link">Bağlantı</Label>
              <Input
                id="ann-link"
                placeholder="/hesabim/abonelik ya da https://…"
                value={form.linkUrl ?? ""}
                onChange={(e) => set({ linkUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-link-label">Düğme yazısı</Label>
              <Input
                id="ann-link-label"
                maxLength={40}
                value={form.linkLabel ?? ""}
                onChange={(e) => set({ linkLabel: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tür</Label>
            <div className="flex gap-1">
              {(Object.keys(TONES) as Tone[]).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={form.tone === t ? "default" : "outline"}
                  onClick={() => set({ tone: t })}
                >
                  {TONES[t].label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Kime</Label>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(AUDIENCES) as Audience[]).map((a) => (
                <Button
                  key={a}
                  type="button"
                  size="sm"
                  variant={form.audience === a ? "default" : "outline"}
                  onClick={() => set({ audience: a })}
                >
                  {AUDIENCES[a]}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ann-start">Başlangıç</Label>
              <Input
                id="ann-start"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set({ startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-end">Bitiş (isteğe bağlı)</Label>
              <Input
                id="ann-end"
                type="datetime-local"
                value={form.endsAt ?? ""}
                onChange={(e) => set({ endsAt: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <Switch
                checked={form.dismissible}
                onCheckedChange={(v) => set({ dismissible: v })}
              />
              Üye kapatabilsin
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => set({ active: v })}
              />
              Etkin
            </label>
          </div>
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Vazgeç
          </Button>
          <Button disabled={saving || !form.title.trim()} onClick={submit}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
