"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Loader2, Pencil, Plus } from "lucide-react";
import {
  KIND_META,
  RESET_LABEL,
  listFeatures,
  listPlanVersions,
  moveSubscribers,
  saveFeature,
  type Feature,
  type FeatureKind,
  type FeatureRequest,
  type PlanVersion,
  type ResetPeriod,
} from "@/lib/api/features";
import { getAdminPackages } from "@/lib/api/packages";
import type { PlanPackageResponse } from "@/lib/api/types";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { money } from "./revenue-panel";

const KINDS: FeatureKind[] = ["BOOLEAN", "LIMIT", "METERED", "CREDIT"];
const RESETS: ResetPeriod[] = ["NONE", "DAY", "WEEK", "MONTH"];

function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

/** Feature catalog and the version history of each package. */
export function FeaturesVersionsPanel() {
  const { user } = useAuth();
  const editable = canWrite(user?.adminRole, "money");
  return (
    <div className="space-y-6">
      <FeaturesCard editable={editable} />
      <VersionsCard editable={editable} />
    </div>
  );
}

function FeaturesCard({ editable }: { editable: boolean }) {
  const [rows, setRows] = useState<Feature[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Feature | "new" | null>(null);

  useEffect(() => {
    let cancelled = false;
    listFeatures()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Özellikler alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saved = (feature: Feature) => {
    setRows((current) => {
      const list = current ?? [];
      const index = list.findIndex((row) => row.key === feature.key);
      if (index < 0) return [...list, feature];
      const next = [...list];
      next[index] = feature;
      return next;
    });
    setEditing(null);
  };

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Özellikler</CardTitle>
          <CardDescription>
            Paketlerin ve ek ürünlerin verdiği haklar ve her birinin nasıl
            ölçüldüğü. Kapasite türündeki haklarda kullanım, mevcut kayıtlar
            sayılarak hesaplanır.
          </CardDescription>
        </div>
        {editable ? (
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Yeni özellik
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {error ? <ErrorBox text={error} /> : null}
        {rows == null ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Özellik</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Sıfırlanma</TableHead>
                  <TableHead>Üst özellik</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <div className="font-medium">{row.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {row.key}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {KIND_META[row.kind].label}
                      </Badge>
                      {row.countedLive ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          canlı sayım
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.unit ?? "—"}</TableCell>
                    <TableCell>
                      {RESET_LABEL[row.resetPeriod]}
                      {row.kind === "METERED" && row.freeQuota != null ? (
                        <span className="block text-xs text-muted-foreground">
                          {row.freeQuota} ücretsiz
                          {row.unlimitedWithParent
                            ? " · üst özellikle sınırsız"
                            : ""}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.parentKey ?? "—"}
                    </TableCell>
                    <TableCell>
                      {editable ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`${row.name} düzenle`}
                          onClick={() => setEditing(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {editing ? (
        <FeatureDialog
          initial={editing === "new" ? null : editing}
          parents={(rows ?? []).filter(
            (row) => editing === "new" || row.key !== editing.key,
          )}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      ) : null}
    </Card>
  );
}

function FeatureDialog({
  initial,
  parents,
  onClose,
  onSaved,
}: {
  initial: Feature | null;
  parents: Feature[];
  onClose: () => void;
  onSaved: (feature: Feature) => void;
}) {
  const [form, setForm] = useState<FeatureRequest>(
    initial ?? {
      key: "",
      name: "",
      kind: "BOOLEAN",
      unit: null,
      resetPeriod: "NONE",
      parentKey: null,
      description: null,
      freeQuota: null,
      unlimitedWithParent: false,
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<FeatureRequest>) =>
    setForm((current) => ({ ...current, ...patch }));
  const kindLocked = initial?.countedLive ?? false;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      onSaved(
        await saveFeature({
          ...form,
          resetPeriod: form.kind === "METERED" ? form.resetPeriod : "NONE",
          freeQuota: form.kind === "METERED" ? form.freeQuota : null,
          unlimitedWithParent:
            form.kind === "METERED" &&
            form.parentKey != null &&
            form.unlimitedWithParent,
        }),
      );
    } catch (err) {
      setError(errorText(err, "Kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Özelliği düzenle" : "Yeni özellik"}
          </DialogTitle>
          <DialogDescription>{KIND_META[form.kind].hint}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="feature-key">Anahtar</Label>
              <Input
                id="feature-key"
                value={form.key}
                disabled={initial != null}
                placeholder="ORNEK_OZELLIK"
                onChange={(e) => set({ key: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feature-name">Ad</Label>
              <Input
                id="feature-name"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select
                value={form.kind}
                disabled={kindLocked}
                onValueChange={(v) => set({ kind: v as FeatureKind })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{KIND_META[form.kind].label}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {KIND_META[kind].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feature-unit">Birim</Label>
              <Input
                id="feature-unit"
                value={form.unit ?? ""}
                placeholder="şube, rapor…"
                onChange={(e) => set({ unit: e.target.value || null })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sıfırlanma</Label>
              <Select
                value={form.kind === "METERED" ? form.resetPeriod : "NONE"}
                disabled={form.kind !== "METERED"}
                onValueChange={(v) => set({ resetPeriod: v as ResetPeriod })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {
                      RESET_LABEL[
                        form.kind === "METERED" ? form.resetPeriod : "NONE"
                      ]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RESETS.map((reset) => (
                    <SelectItem key={reset} value={reset}>
                      {RESET_LABEL[reset]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Üst özellik</Label>
              <Select
                value={form.parentKey ?? "__none"}
                onValueChange={(v) =>
                  set({ parentKey: v === "__none" ? null : (v as string) })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {parents.find((p) => p.key === form.parentKey)?.name ??
                      "Yok"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Yok</SelectItem>
                  {parents.map((parent) => (
                    <SelectItem key={parent.key} value={parent.key}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.kind === "METERED" ? (
            <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="feature-free-quota">Ücretsiz hak / dönem</Label>
                <Input
                  id="feature-free-quota"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Yok"
                  value={form.freeQuota ?? ""}
                  onChange={(e) =>
                    set({
                      freeQuota:
                        e.target.value === ""
                          ? null
                          : Math.max(0, Math.floor(Number(e.target.value))),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Pakette bu özellik yoksa her dönem verilen hak.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feature-unlimited-parent">
                  Üst özellikle sınırsız
                </Label>
                <div className="flex h-9 items-center">
                  <Switch
                    id="feature-unlimited-parent"
                    checked={form.unlimitedWithParent}
                    disabled={form.parentKey == null}
                    onCheckedChange={(checked) =>
                      set({ unlimitedWithParent: Boolean(checked) })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Üst özellik pakette varsa ve ayrıca sayı verilmemişse
                  sınırsız.
                </p>
              </div>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="feature-description">Açıklama</Label>
            <Input
              id="feature-description"
              value={form.description ?? ""}
              onChange={(e) => set({ description: e.target.value || null })}
            />
          </div>
          {error ? <ErrorBox text={error} /> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !form.key.trim() || !form.name.trim()}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionsCard({ editable }: { editable: boolean }) {
  const [packages, setPackages] = useState<PlanPackageResponse[] | null>(null);
  const [packageId, setPackageId] = useState<number | null>(null);
  const [versions, setVersions] = useState<PlanVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAdminPackages()
      .then((data) => {
        if (cancelled) return;
        setPackages(data);
        const first = data.find((p) => p.purchasable && p.active) ?? data[0];
        if (first) setPackageId((current) => current ?? first.id);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Paketler alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (packageId == null) return;
    let cancelled = false;
    listPlanVersions(packageId)
      .then((data) => {
        if (!cancelled) setVersions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Sürümler alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, [packageId, reload]);

  const selected = useMemo(
    () => packages?.find((p) => p.id === packageId) ?? null,
    [packages, packageId],
  );
  const current = versions?.find((v) => v.current) ?? null;

  const moveAll = async (from: PlanVersion) => {
    if (!current || packageId == null) return;
    const ok = window.confirm(
      `${from.activeSubscribers} abone v${from.version} → v${current.version} sürümüne taşınacak. ` +
        "Hakları bir sonraki yenilemede yeni sürüme göre verilir; ödedikleri ücret değişmez.",
    );
    if (!ok) return;
    setMoving(from.id);
    setError(null);
    try {
      const result = await moveSubscribers(packageId, current.id, from.id);
      setNotice(`${result.moved} abone v${current.version} sürümüne taşındı.`);
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorText(err, "Taşınamadı."));
    } finally {
      setMoving(null);
    }
  };

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader>
        <CardTitle className="text-base">Paket sürümleri</CardTitle>
        <CardDescription>
          Paketin içeriği veya liste fiyatı her değiştiğinde yeni bir sürüm
          açılır. Mevcut aboneler satın aldıkları sürümde kalır; yeni sürüme
          ancak siz taşırsanız geçerler.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <ErrorBox text={error} /> : null}
        {notice ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {notice}
          </div>
        ) : null}
        <div className="max-w-sm space-y-1.5">
          <Label>Paket</Label>
          <Select
            value={packageId == null ? null : String(packageId)}
            onValueChange={(v) => {
              setVersions(null);
              setNotice(null);
              setPackageId(Number(v));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{selected?.name ?? "Seçin"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(packages ?? []).map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                  {p.active ? "" : " (pasif)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {versions == null ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="rounded-lg border border-border/60 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">v{version.version}</span>
                  {version.current ? <Badge>Güncel</Badge> : null}
                  <span className="text-sm text-muted-foreground">
                    {money(version.price)}
                    {version.yearlyPrice != null
                      ? ` · yıllık ${money(version.yearlyPrice)}`
                      : ""}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    · {version.activeSubscribers} aktif abone
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(version.createdAt).toLocaleString("tr-TR")}
                    {version.createdBy ? ` · ${version.createdBy}` : ""}
                  </span>
                </div>
                {version.note ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {version.note}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {version.lines.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Kalem yok
                    </span>
                  ) : (
                    version.lines.map((line) => (
                      <Badge key={line.productId} variant="outline">
                        {line.productName}:{" "}
                        {line.unlimited ? "Sınırsız" : line.quantity}
                      </Badge>
                    ))
                  )}
                </div>
                {editable &&
                !version.current &&
                version.activeSubscribers > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    disabled={moving != null}
                    onClick={() => moveAll(version)}
                  >
                    {moving === version.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="size-4" />
                    )}
                    Abonelerini güncel sürüme taşı
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {text}
    </div>
  );
}
