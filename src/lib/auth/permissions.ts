import type { AdminRole } from "./jwt";

/** Areas of the panel; mirrors AdminPermissions on the server so buttons hide instead of failing. */
export type AdminArea =
  | "accounts" // admin accounts, audit log, system
  | "money" // payments, packages, coupons, campaigns, prices, invoices, grants
  | "collections"
  | "members"
  | "content"; // announcements, e-mail templates, FAQ, themes

const WRITERS: Record<AdminArea, AdminRole[]> = {
  accounts: [],
  money: ["FINANCE"],
  collections: ["FINANCE", "SUPPORT"],
  members: ["SUPPORT"],
  content: ["SUPPORT"],
};

export function canWrite(role: AdminRole | undefined, area: AdminArea) {
  if (!role) return false;
  return role === "ADMIN" || WRITERS[area].includes(role);
}

export function canSee(role: AdminRole | undefined, area: AdminArea) {
  if (!role) return false;
  return area === "accounts" ? role === "ADMIN" : true;
}

export const ADMIN_ROLE_META: Record<
  AdminRole,
  { label: string; hint: string; className: string }
> = {
  ADMIN: {
    label: "Süper admin",
    hint: "Her şeyi yapar; yönetici hesaplarını ve işlem geçmişini görür.",
    className:
      "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  FINANCE: {
    label: "Finans",
    hint: "Ödemeler, paketler, kuponlar, fiyatlar, faturalar ve tahsilat.",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  SUPPORT: {
    label: "Destek",
    hint: "Üyeler, geri bildirimler, tahsilat notları, duyurular ve içerik.",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  VIEWER: {
    label: "İzleyici",
    hint: "Her şeyi görür, hiçbir şeyi değiştiremez.",
    className: "border-border bg-muted text-muted-foreground",
  },
};

export const ADMIN_ROLE_ORDER: AdminRole[] = [
  "ADMIN",
  "FINANCE",
  "SUPPORT",
  "VIEWER",
];
