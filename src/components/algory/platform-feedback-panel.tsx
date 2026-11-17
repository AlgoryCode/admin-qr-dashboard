"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";

import {
  DEFAULT_PAGE_SIZE,
  listPlatformFeedback,
  updatePlatformFeedback,
  type PlatformFeedbackItem,
  type PlatformFeedbackStatus,
  getTicketSummary,
  PRIORITY_META,
  type TicketPriority,
  type TicketSummary,
} from "@/lib/api/platform-feedback";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { canWrite } from "@/lib/auth/permissions";
import { listDashboardUsers } from "@/lib/api/security";
import { TicketThread } from "./ticket-thread";

const STATUS_LABELS: Record<PlatformFeedbackStatus, string> = {
  OPEN: "Açık",
  IN_PROGRESS: "İşlemde",
  RESOLVED: "Çözüldü",
};

const STATUS_VARIANTS: Record<
  PlatformFeedbackStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  OPEN: "destructive",
  IN_PROGRESS: "secondary",
  RESOLVED: "outline",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type ListParams = {
  page: number;
  status?: PlatformFeedbackStatus;
  q?: string;
  priority?: TicketPriority;
  assigneeId?: number;
};

export function PlatformFeedbackPanel() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    PlatformFeedbackStatus | "all"
  >("all");
  const [listParams, setListParams] = useState<ListParams>({ page: 0 });
  const [items, setItems] = useState<PlatformFeedbackItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlatformFeedbackItem | null>(null);
  const [editStatus, setEditStatus] = useState<PlatformFeedbackStatus>("OPEN");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { user } = useAuth();
  const editable = canWrite(user?.adminRole, "members");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">(
    "all",
  );
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "none">(
    "all",
  );
  const [editPriority, setEditPriority] = useState<TicketPriority>("NORMAL");
  const [editOwner, setEditOwner] = useState<string>("none");
  const [owners, setOwners] = useState<{ id: number; name: string }[]>([]);
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [summaryTick, setSummaryTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getTicketSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [summaryTick]);

  useEffect(() => {
    let cancelled = false;
    listDashboardUsers()
      .then((list) => {
        if (!cancelled)
          setOwners(
            list
              .filter((u) => u.active)
              .map((u) => ({
                id: u.id,
                name:
                  u.username ||
                  `${u.firstName} ${u.lastName}`.trim() ||
                  u.email,
              })),
          );
      })
      .catch(() => {
        // Only super admins can list accounts; others can still take a ticket themselves.
        if (!cancelled && user) setOwners([{ id: user.userId, name: "Ben" }]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const fetchItems = useCallback(async (params: ListParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listPlatformFeedback(
        params.page,
        DEFAULT_PAGE_SIZE,
        {
          status: params.status,
          q: params.q,
          priority: params.priority,
          assigneeId: params.assigneeId,
        },
      );
      setItems(result.content);
      setPage(result.page);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setHasNext(result.hasNext);
    } catch (err) {
      setItems([]);
      setTotalElements(0);
      setTotalPages(0);
      setHasNext(false);

      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Geri bildirimler yüklenemedi.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(listParams);
  }, [listParams, fetchItems]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setListParams({
      page: 0,
      status: statusFilter === "all" ? undefined : statusFilter,
      q: query.trim() || undefined,
      priority: priorityFilter === "all" ? undefined : priorityFilter,
      assigneeId:
        ownerFilter === "mine"
          ? user?.userId
          : ownerFilter === "none"
            ? 0
            : undefined,
    });
  }

  function openDetail(item: PlatformFeedbackItem) {
    setSelected(item);
    setEditStatus(item.status);
    setEditNote(item.adminNote ?? "");
    setEditPriority(item.priority ?? "NORMAL");
    setEditOwner(item.assigneeId != null ? String(item.assigneeId) : "none");
    setSaveError(null);
  }

  async function handleSave() {
    if (!selected) return;

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updatePlatformFeedback(selected.id, {
        status: editStatus,
        adminNote: editNote.trim() || undefined,
        priority: editPriority,
        ...(editOwner === "none"
          ? { unassign: true }
          : { assigneeId: Number(editOwner) }),
      });
      setSummaryTick((n) => n + 1);
      setSelected(updated);
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else if (err instanceof Error) {
        setSaveError(err.message);
      } else {
        setSaveError("Kaydedilemedi.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Destek Talepleri</CardTitle>
          <CardDescription>
            Platform kullanıcılarından gelen sorun ve öneri bildirimleri · sayfa
            başına {DEFAULT_PAGE_SIZE} kayıt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Yanıt bekleyen", summary.open, summary.open > 0],
                ["İşlemde", summary.inProgress, false],
                ["Sahipsiz", summary.unassigned, summary.unassigned > 0],
                ["Acil", summary.urgent, summary.urgent > 0],
                [
                  "Ort. ilk yanıt",
                  summary.avgFirstResponseHours == null
                    ? "—"
                    : `${summary.avgFirstResponseHours.toLocaleString("tr-TR")} sa`,
                  false,
                ],
                ["Son 30 günde çözülen", summary.resolvedLast30Days, false],
              ].map(([label, value, alert]) => (
                <div
                  key={String(label)}
                  className="rounded-lg border border-border/60 px-3 py-2"
                >
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div
                    className={
                      alert
                        ? "text-lg font-semibold text-destructive tabular-nums"
                        : "text-lg font-semibold tabular-nums"
                    }
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Başlık, konu veya açıklamada ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <div className="w-full sm:w-44">
              <Label htmlFor="status-filter" className="sr-only">
                Durum
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as PlatformFeedbackStatus | "all")
                }
              >
                <SelectTrigger id="status-filter">
                  <SelectValue>
                    {statusFilter === "all" ? "Tüm durumlar" : STATUS_LABELS[statusFilter]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm durumlar</SelectItem>
                  <SelectItem value="OPEN">Açık</SelectItem>
                  <SelectItem value="IN_PROGRESS">İşlemde</SelectItem>
                  <SelectItem value="RESOLVED">Çözüldü</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Select
                value={priorityFilter}
                onValueChange={(v) =>
                  setPriorityFilter(v as TicketPriority | "all")
                }
              >
                <SelectTrigger aria-label="Öncelik">
                  <SelectValue>
                    {priorityFilter === "all"
                      ? "Tüm öncelikler"
                      : PRIORITY_META[priorityFilter].label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm öncelikler</SelectItem>
                  {(Object.keys(PRIORITY_META) as TicketPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Select
                value={ownerFilter}
                onValueChange={(v) =>
                  setOwnerFilter(v as "all" | "mine" | "none")
                }
              >
                <SelectTrigger aria-label="Sorumlu">
                  <SelectValue>
                    {ownerFilter === "mine"
                      ? "Bana atanan"
                      : ownerFilter === "none"
                        ? "Sahipsiz"
                        : "Herkes"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Herkes</SelectItem>
                  <SelectItem value="mine">Bana atanan</SelectItem>
                  <SelectItem value="none">Sahipsiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Aranıyor
                </>
              ) : (
                <>
                  <Search />
                  Ara
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Sorumlu</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Geri bildirim bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(item)}
                    >
                      <TableCell className="font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell>{item.subject}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate">{item.userFullName || "—"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.userEmail || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[item.status]}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            PRIORITY_META[item.priority ?? "NORMAL"].className
                          }
                        >
                          {PRIORITY_META[item.priority ?? "NORMAL"].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.assigneeName ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>{totalElements} kayıt</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || page <= 0}
                onClick={() =>
                  setListParams((prev) => ({
                    ...prev,
                    page: Math.max(prev.page - 1, 0),
                  }))
                }
              >
                Önceki
              </Button>
              <span>
                {page + 1} / {Math.max(totalPages, 1)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || !hasNext}
                onClick={() =>
                  setListParams((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Sonraki
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={selected != null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.userFullName || "Kullanıcı"} ·{" "}
                  {selected.userEmail || "—"} · {formatDate(selected.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Konu
                    </p>
                    <p className="mt-1 text-sm">{selected.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Durum
                    </p>
                    <Badge
                      className="mt-1"
                      variant={STATUS_VARIANTS[selected.status]}
                    >
                      {STATUS_LABELS[selected.status]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Açıklama
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {selected.description}
                  </p>
                </div>

                {selected.screenshotUrl ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ekran görüntüsü
                    </p>
                    <div className="mt-2 overflow-hidden rounded-lg border border-border/60">
                      <img
                        src={selected.screenshotUrl}
                        alt="Kullanıcı ekran görüntüsü"
                        className="max-h-80 w-full object-contain bg-muted/20"
                      />
                    </div>
                    <a
                      href={selected.screenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Tam boyutta aç
                    </a>
                  </div>
                ) : null}

                <TicketThread
                  ticketId={selected.id}
                  editable={editable}
                  onReplied={() => {
                    setSummaryTick((n) => n + 1);
                    setListParams((p) => ({ ...p }));
                    if (editStatus === "OPEN") setEditStatus("IN_PROGRESS");
                  }}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Öncelik</Label>
                    <Select
                      value={editPriority}
                      onValueChange={(v) =>
                        setEditPriority(v as TicketPriority)
                      }
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {PRIORITY_META[editPriority].label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PRIORITY_META) as TicketPriority[]).map(
                          (p) => (
                            <SelectItem key={p} value={p}>
                              {PRIORITY_META[p].label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sorumlu</Label>
                    <Select
                      value={editOwner}
                      onValueChange={(v) => setEditOwner(String(v ?? "none"))}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {editOwner === "none"
                            ? "Atanmamış"
                            : (owners.find((o) => String(o.id) === editOwner)
                                ?.name ??
                              selected.assigneeName ??
                              "—")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Atanmamış</SelectItem>
                        {owners.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-status">Durum güncelle</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(value) =>
                      setEditStatus(value as PlatformFeedbackStatus)
                    }
                    disabled={saving}
                  >
                    <SelectTrigger id="feedback-status">
                      <SelectValue>{STATUS_LABELS[editStatus]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Açık</SelectItem>
                      <SelectItem value="IN_PROGRESS">İşlemde</SelectItem>
                      <SelectItem value="RESOLVED">Çözüldü</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-admin-note">İç not</Label>
                  <Textarea
                    id="feedback-admin-note"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Müşteri hizmetleri notu..."
                    rows={3}
                    disabled={saving}
                  />
                </div>

                {saveError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {saveError}
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelected(null)}
                >
                  Kapat
                </Button>
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Kaydediliyor
                    </>
                  ) : (
                    "Kaydet"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
