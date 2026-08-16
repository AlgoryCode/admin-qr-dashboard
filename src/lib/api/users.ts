import { apiRequest } from "./client";
import type { ExtendTrialRequest, ExtendTrialResponse, ImpersonateResponse, UserDetailResponse, UserPageResponse, UserUpdateRequest } from "./types";

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
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function impersonateUser(id: number) {
  return apiRequest<ImpersonateResponse>(`/admin/users/${id}/impersonate`, {
    method: "POST",
  });
}

export function extendUserTrial(id: number, data: ExtendTrialRequest) {
  return apiRequest<ExtendTrialResponse>(`/admin/users/${id}/trial/extend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export { DEFAULT_PAGE_SIZE as USERS_PAGE_SIZE };
