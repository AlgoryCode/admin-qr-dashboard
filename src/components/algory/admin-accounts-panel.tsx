"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  Loader2,
  LogOut,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  ShieldOff,
  UserCog,
} from "lucide-react";
import {
  createDashboardUser,
  listDashboardUserSessions,
  listDashboardUsers,
  resetDashboardUserMfa,
  revokeAllDashboardUserSessions,
  setDashboardUserPassword,
  updateDashboardUser,
  type AdminSession,
  type DashboardUser,
} from "@/lib/api/security";
import type { AdminRole } from "@/lib/auth/jwt";
import { ADMIN_ROLE_META, ADMIN_ROLE_ORDER } from "@/lib/auth/permissions";
import { useAuth } from "@/context/auth-context";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, SessionList } from "./security-settings";

function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <Badge variant="outline" className={ADMIN_ROLE_META[role].className}>
      {ADMIN_ROLE_META[role].label}
    </Badge>
  );
}

function RoleSelect({
  value,
  onChange,
  id,
}: {
  value: AdminRole;
  onChange: (r: AdminRole) => void;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as AdminRole)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>{ADMIN_ROLE_META[value].label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ADMIN_ROLE_ORDER.map((r) => (
          <SelectItem key={r} value={r}>
            <div>
              <div>{ADMIN_ROLE_META[r].label}</div>
              <div className="text-xs text-muted-foreground">
                {ADMIN_ROLE_META[r].hint}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type Dialogs =
  | { kind: "create" }
  | { kind: "edit"; user: DashboardUser }
  | { kind: "password"; user: DashboardUser }
  | { kind: "sessions"; user: DashboardUser }
  | null;

export function AdminAccountsPanel() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<DashboardUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState<Dialogs>(null);

  useEffect(() => {
    let cancelled = false;
    listDashboardUsers()
      .then((data) => {
        if (!cancelled) {
          setUsers(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Hesaplar alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = () => setVersion((v) => v + 1);

  async function act(action: () => Promise<unknown>, done: string) {
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
      reload();
    } catch (err) {
      setError(errorText(err, "İşlem yapılamadı."));
    }
  }

  const activeAdmins =
    users?.filter((u) => u.active && u.role === "ADMIN").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Yöneticiler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Panele kimin, hangi yetkiyle girebildiği. Rol, şifre veya durum
            değişince hesabın tüm oturumları kapanır.
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: "create" })}>
          <Plus />
          Yönetici ekle
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {ADMIN_ROLE_ORDER.map((r) => (
          <div key={r} className="rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <RoleBadge role={r} />
              <span className="text-sm font-medium tabular-nums">
                {users?.filter((u) => u.active && u.role === r).length ?? "–"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {ADMIN_ROLE_META[r].hint}
            </p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Yönetici</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>2 adım</TableHead>
              <TableHead>Son giriş</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!users && error ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Liste yüklenemedi.
                </TableCell>
              </TableRow>
            ) : !users ? (
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              users.map((u) => {
                const isMe = me?.userId === u.id;
                const lastAdmin =
                  u.role === "ADMIN" && u.active && activeAdmins <= 1;
                return (
                  <TableRow
                    key={u.id}
                    className={u.active ? undefined : "opacity-60"}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {u.firstName} {u.lastName}
                        {isMe ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (sen)
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {u.username ? (
                          <span className="font-mono">{u.username}</span>
                        ) : null}
                        {u.username ? " · " : null}
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell>
                      {u.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="size-3.5" /> Açık
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                          <ShieldOff className="size-3.5" /> Kapalı
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(u.lastLoginAt)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.active}
                        disabled={isMe || lastAdmin}
                        aria-label={u.active ? "Pasif yap" : "Aktif yap"}
                        onCheckedChange={(checked) =>
                          act(
                            () =>
                              updateDashboardUser(u.id, { active: checked }),
                            checked
                              ? "Hesap aktif edildi."
                              : "Hesap pasif yapıldı; oturumları kapandı.",
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="İşlemler"
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setDialog({ kind: "edit", user: u })}
                          >
                            <UserCog /> Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ kind: "password", user: u })
                            }
                          >
                            <KeyRound /> Şifre belirle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDialog({ kind: "sessions", user: u })
                            }
                          >
                            <LogOut /> Oturumlar
                          </DropdownMenuItem>
                          {u.mfaEnabled ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `${u.firstName} için iki adımlı doğrulama sıfırlansın mı? Telefonunu kaybettiyse kullan.`,
                                    )
                                  )
                                    act(
                                      () => resetDashboardUserMfa(u.id),
                                      "İki adımlı doğrulama sıfırlandı.",
                                    );
                                }}
                              >
                                <ShieldOff /> 2 adımı sıfırla
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateDialog
        open={dialog?.kind === "create"}
        onClose={() => setDialog(null)}
        onDone={() => {
          setDialog(null);
          setNotice("Yönetici eklendi.");
          reload();
        }}
      />
      <EditDialog
        user={dialog?.kind === "edit" ? dialog.user : null}
        onClose={() => setDialog(null)}
        onDone={() => {
          setDialog(null);
          setNotice("Hesap güncellendi.");
          reload();
        }}
      />
      <PasswordDialog
        user={dialog?.kind === "password" ? dialog.user : null}
        onClose={() => setDialog(null)}
        onDone={() => {
          setDialog(null);
          setNotice("Şifre belirlendi; hesabın oturumları kapandı.");
        }}
      />
      <SessionsDialog
        user={dialog?.kind === "sessions" ? dialog.user : null}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(action: () => Promise<unknown>, onDone: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onDone();
    } catch (err) {
      setError(errorText(err, "Kaydedilemedi."));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, setError, submit };
}

function CreateDialog({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });
  const [role, setRole] = useState<AdminRole>("VIEWER");
  const { busy, error, setError, submit } = useSubmit();
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setForm({
            firstName: "",
            lastName: "",
            email: "",
            username: "",
            password: "",
          });
          setRole("VIEWER");
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yönetici ekle</DialogTitle>
          <DialogDescription>
            Geçici bir şifre belirle; kişi girdikten sonra Ayarlar&apos;dan
            değiştirsin.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-admin"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit(
              () =>
                createDashboardUser({
                  ...form,
                  username: form.username.trim() || undefined,
                  role,
                }),
              onDone,
            );
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ca-first">Ad</Label>
              <Input
                id="ca-first"
                required
                value={form.firstName}
                onChange={set("firstName")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ca-last">Soyad</Label>
              <Input
                id="ca-last"
                required
                value={form.lastName}
                onChange={set("lastName")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ca-email">E-posta</Label>
            <Input
              id="ca-email"
              type="email"
              required
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ca-username">Kullanıcı adı</Label>
            <Input
              id="ca-username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="giriş için"
              value={form.username}
              onChange={set("username")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ca-role">Rol</Label>
            <RoleSelect id="ca-role" value={role} onChange={setRole} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ca-password">Geçici şifre</Label>
            <Input
              id="ca-password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
              value={form.password}
              onChange={set("password")}
            />
            <p className="text-xs text-muted-foreground">En az 10 karakter.</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button
            type="submit"
            form="create-admin"
            disabled={busy || form.password.length < 10}
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  user,
  onClose,
  onDone,
}: {
  user: DashboardUser | null;
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <Dialog open={user != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {user ? (
          <EditForm
            key={user.id}
            user={user}
            onClose={onClose}
            onDone={onDone}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  user,
  onClose,
  onDone,
}: {
  user: DashboardUser;
  onClose: () => void;
  onDone: () => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [username, setUsername] = useState(user.username ?? "");
  const [role, setRole] = useState<AdminRole>(user.role);
  const { busy, error, submit } = useSubmit();
  return (
    <>
      <DialogHeader>
        <DialogTitle>Hesabı düzenle</DialogTitle>
        <DialogDescription>{user.email}</DialogDescription>
      </DialogHeader>
      <form
        id="edit-admin"
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(
            () =>
              updateDashboardUser(user.id, {
                firstName,
                lastName,
                username: username.trim(),
                role: role !== user.role ? role : undefined,
              }),
            onDone,
          );
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ea-first">Ad</Label>
            <Input
              id="ea-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ea-last">Soyad</Label>
            <Input
              id="ea-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ea-username">Kullanıcı adı</Label>
          <Input
            id="ea-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ea-role">Rol</Label>
          <RoleSelect id="ea-role" value={role} onChange={setRole} />
          {role !== user.role ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Rol değişince hesabın oturumları kapanır.
            </p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Vazgeç
        </Button>
        <Button type="submit" form="edit-admin" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          Kaydet
        </Button>
      </DialogFooter>
    </>
  );
}

function PasswordDialog({
  user,
  onClose,
  onDone,
}: {
  user: DashboardUser | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const { busy, error, setError, submit } = useSubmit();
  return (
    <Dialog
      open={user != null}
      onOpenChange={(o) => {
        if (!o) {
          setPassword("");
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Şifre belirle</DialogTitle>
          <DialogDescription>
            {user?.firstName} {user?.lastName} için yeni şifre. Tüm oturumları
            kapanır.
          </DialogDescription>
        </DialogHeader>
        <form
          id="set-password"
          onSubmit={(e) => {
            e.preventDefault();
            if (user)
              submit(
                () => setDashboardUserPassword(user.id, password),
                () => {
                  setPassword("");
                  onDone();
                },
              );
          }}
          className="space-y-2"
        >
          <Label htmlFor="sp-password">Yeni şifre</Label>
          <Input
            id="sp-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">En az 10 karakter.</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button
            type="submit"
            form="set-password"
            disabled={busy || password.length < 10}
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionsDialog({
  user,
  onClose,
}: {
  user: DashboardUser | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={user != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {user ? <SessionsBody key={user.id} user={user} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function SessionsBody({ user }: { user: DashboardUser }) {
  const [sessions, setSessions] = useState<AdminSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listDashboardUserSessions(user.id)
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Oturumlar alınamadı."));
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, version]);

  const active = sessions?.filter((s) => s.active) ?? [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Oturumlar</DialogTitle>
        <DialogDescription>
          {user.firstName} {user.lastName} · {active.length} açık oturum
        </DialogDescription>
      </DialogHeader>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="max-h-[50vh] overflow-y-auto">
        {!sessions ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <SessionList sessions={sessions.slice(0, 20)} />
        )}
      </div>
      <DialogFooter>
        <Button
          variant="destructive"
          disabled={busy || active.length === 0}
          onClick={async () => {
            setBusy(true);
            try {
              await revokeAllDashboardUserSessions(user.id);
              setVersion((v) => v + 1);
            } catch (err) {
              setError(errorText(err, "Kapatılamadı."));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="animate-spin" /> : <LogOut />}
          Tümünü kapat
        </Button>
      </DialogFooter>
    </>
  );
}
