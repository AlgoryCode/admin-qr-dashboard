"use client";

import { useEffect, useState } from "react";
import { EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteFaq,
  listFaq,
  saveFaq,
  type FaqEntry,
  type FaqRequest,
} from "@/lib/api/content";
import { useAuth } from "@/context/auth-context";
import { canWrite } from "@/lib/auth/permissions";
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

export function FaqPanel() {
  const { user } = useAuth();
  const editable = canWrite(user?.adminRole, "content");
  const [rows, setRows] = useState<FaqEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<FaqEntry | "new" | null>(null);

  useEffect(() => {
    let cancelled = false;
    listFaq()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Sorular alınamadı.");
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const groups = new Map<string, FaqEntry[]>();
  for (const row of rows ?? []) {
    groups.set(row.category, [...(groups.get(row.category) ?? []), row]);
  }

  async function remove(entry: FaqEntry) {
    if (!window.confirm(`"${entry.question}" silinsin mi?`)) return;
    try {
      await deleteFaq(entry.id);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Üye panelindeki yardım bölümünde ve herkese açık SSS uç noktasında
          görünür.
        </p>
        {editable ? (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus />
            Yeni soru
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
          Henüz soru yok.
        </p>
      ) : (
        [...groups.entries()].map(([category, entries]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {category}
            </h3>
            {entries.map((e) => (
              <details
                key={e.id}
                className="group rounded-lg border border-border/60 px-3 py-2"
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                  {!e.published ? (
                    <EyeOff className="size-3.5 text-muted-foreground" />
                  ) : null}
                  <span className="flex-1">{e.question}</span>
                  {editable ? (
                    <span
                      className="flex gap-1"
                      onClick={(ev) => ev.preventDefault()}
                    >
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Düzenle"
                        onClick={() => setEditing(e)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Sil"
                        className="text-destructive"
                        onClick={() => remove(e)}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  ) : null}
                </summary>
                <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                  {e.answer}
                </p>
              </details>
            ))}
          </div>
        ))
      )}
      {editing ? (
        <FaqDialog
          initial={editing === "new" ? null : editing}
          categories={[...groups.keys()]}
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

function FaqDialog({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: FaqEntry | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FaqRequest>({
    category: initial?.category ?? categories[0] ?? "Genel",
    question: initial?.question ?? "",
    answer: initial?.answer ?? "",
    sortOrder: initial?.sortOrder ?? 0,
    published: initial?.published ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<FaqRequest>) =>
    setForm((f) => ({ ...f, ...patch }));

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await saveFaq(initial?.id ?? null, form);
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
          <DialogTitle>{initial ? "Soruyu düzenle" : "Yeni soru"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="faq-cat">Kategori</Label>
              <Input
                id="faq-cat"
                list="faq-categories"
                maxLength={60}
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
              />
              <datalist id="faq-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faq-order">Sıra</Label>
              <Input
                id="faq-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  set({ sortOrder: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faq-q">Soru</Label>
            <Input
              id="faq-q"
              maxLength={240}
              value={form.question}
              onChange={(e) => set({ question: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faq-a">Cevap</Label>
            <Textarea
              id="faq-a"
              rows={6}
              maxLength={8000}
              value={form.answer}
              onChange={(e) => set({ answer: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={form.published}
              onCheckedChange={(v) => set({ published: v })}
            />
            Yayında
          </label>
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
          <Button
            disabled={
              saving ||
              !form.question.trim() ||
              !form.answer.trim() ||
              !form.category.trim()
            }
            onClick={submit}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
