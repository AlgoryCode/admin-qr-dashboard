import type { AdminRole } from "@/lib/auth/jwt";
import { apiRequest } from "./client";

export type MeResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  active: boolean;
  username: string | null;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
};

export type AdminSession = {
  id: string;
  loggedInAt: string;
  lastActivityAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  active: boolean;
  current: boolean;
};

export type MfaSetup = {
  secret: string;
  otpauthUri: string;
  qrPngBase64: string | null;
};

export const getMe = () => apiRequest<MeResponse>("/dashboard/auth/me");

export const changeOwnPassword = (
  currentPassword: string,
  newPassword: string,
) =>
  apiRequest<void>("/dashboard/auth/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

export const startMfaSetup = () =>
  apiRequest<MfaSetup>("/dashboard/auth/mfa/setup", { method: "POST" });

export const enableMfa = (code: string) =>
  apiRequest<void>("/dashboard/auth/mfa/enable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export const disableMfa = (code: string) =>
  apiRequest<void>("/dashboard/auth/mfa/disable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export const listMySessions = () =>
  apiRequest<AdminSession[]>("/dashboard/auth/sessions");

export const revokeMySession = (id: string) =>
  apiRequest<void>(`/dashboard/auth/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

/* ---- Admin accounts (super admin) ---- */

export type DashboardUser = {
  id: number;
  email: string;
  username: string | null;
  firstName: string;
  lastName: string;
  role: AdminRole;
  active: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
};

export type CreateDashboardUser = {
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  password: string;
};

export type UpdateDashboardUser = Partial<{
  firstName: string;
  lastName: string;
  username: string;
  role: AdminRole;
  active: boolean;
}>;

export const listDashboardUsers = () =>
  apiRequest<DashboardUser[]>("/admin/dashboard-users");

export const createDashboardUser = (body: CreateDashboardUser) =>
  apiRequest<DashboardUser>("/admin/dashboard-users", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateDashboardUser = (id: number, body: UpdateDashboardUser) =>
  apiRequest<DashboardUser>(`/admin/dashboard-users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const setDashboardUserPassword = (id: number, password: string) =>
  apiRequest<void>(`/admin/dashboard-users/${id}/password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });

export const resetDashboardUserMfa = (id: number) =>
  apiRequest<void>(`/admin/dashboard-users/${id}/mfa/reset`, {
    method: "POST",
  });

export const listDashboardUserSessions = (id: number) =>
  apiRequest<AdminSession[]>(`/admin/dashboard-users/${id}/sessions`);

export const revokeAllDashboardUserSessions = (id: number) =>
  apiRequest<{ revoked: number }>(
    `/admin/dashboard-users/${id}/sessions/revoke-all`,
    { method: "POST" },
  );

/* ---- Audit log ---- */

export type AuditEntry = {
  id: number;
  actorId: number | null;
  actorName: string | null;
  actorRole: string | null;
  method: string;
  path: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  status: number;
  outcome: "SUCCESS" | "DENIED" | "FAILED";
  ipAddress: string | null;
  userAgent: string | null;
  requestBody: string | null;
  createdAt: string;
};

export type AuditPage = {
  items: AuditEntry[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type AuditQuery = {
  q?: string;
  outcome?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
};

export function listAuditLog(query: AuditQuery) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  }
  return apiRequest<AuditPage>(`/admin/audit-log?${params}`);
}
