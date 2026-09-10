import { apiRequest } from "./client";
import type {
  EndTrialResponse,
  ExtendTrialRequest,
  ExtendTrialResponse,
  ImpersonateResponse,
  PackageLifecycleResponse,
  PasswordResetResponse,
  ReactivatePackageRequest,
  UserDetailResponse,
  UserPageResponse,
  UserUpdateRequest,
} from "./types";

const DEFAULT_PAGE_SIZE = 10;

export function listUsers(page = 0, size = DEFAULT_PAGE_SIZE, query?: string) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const trimmed = query?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }

  return apiRequest<UserPageResponse>(`/admin/users?${params.toString()}`);
}

export function getUser(id: number) {
  return apiRequest<UserDetailResponse>(`/admin/users/${id}`);
}

export function updateUser(id: number, data: UserUpdateRequest) {
  return apiRequest<UserDetailResponse>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function impersonateUser(id: number) {
  return apiRequest<ImpersonateResponse>(`/admin/users/${id}/impersonation-sessions`, {
    method: "POST",
  });
}

export function extendUserTrial(id: number, data: ExtendTrialRequest) {
  return apiRequest<ExtendTrialResponse>(`/admin/users/${id}/trial`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function endUserTrial(id: number) {
  return apiRequest<EndTrialResponse>(`/admin/users/${id}/trial`, {
    method: "PATCH",
    body: JSON.stringify({ status: "ENDED" }),
  });
}

export function deactivateUserPackage(id: number) {
  return apiRequest<PackageLifecycleResponse>(`/admin/users/${id}/package`, {
    method: "PATCH",
    body: JSON.stringify({ status: "INACTIVE" }),
  });
}

export function reactivateUserPackage(id: number, data: ReactivatePackageRequest) {
  return apiRequest<PackageLifecycleResponse>(`/admin/users/${id}/package`, {
    method: "PATCH",
    body: JSON.stringify({ status: "ACTIVE", days: data.days }),
  });
}

export function sendUserEmailVerification(id: number) {
  return apiRequest<void>(`/admin/users/${id}/email-verifications`, {
    method: "POST",
  });
}

export function resetUserPassword(id: number) {
  return apiRequest<PasswordResetResponse>(`/admin/users/${id}/password-resets`, {
    method: "POST",
  });
}

export { DEFAULT_PAGE_SIZE as USERS_PAGE_SIZE };
