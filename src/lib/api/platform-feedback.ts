import { apiRequest } from "./client";

export type PlatformFeedbackStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface PlatformFeedbackItem {
  id: number;
  userId: number;
  userEmail: string | null;
  userFullName: string | null;
  title: string;
  subject: string;
  description: string;
  screenshotUrl: string | null;
  status: PlatformFeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformFeedbackPageResponse {
  content: PlatformFeedbackItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PlatformFeedbackUpdateRequest {
  status?: PlatformFeedbackStatus;
  adminNote?: string;
}

export const DEFAULT_PAGE_SIZE = 10;

export function listPlatformFeedback(
  page = 0,
  size = DEFAULT_PAGE_SIZE,
  params?: { status?: PlatformFeedbackStatus; q?: string },
) {
  const search = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (params?.status) search.set("status", params.status);
  if (params?.q?.trim()) search.set("q", params.q.trim());

  return apiRequest<PlatformFeedbackPageResponse>(`/admin/platform-feedback?${search.toString()}`);
}

export function getPlatformFeedback(id: number) {
  return apiRequest<PlatformFeedbackItem>(`/admin/platform-feedback/${id}`);
}

export function updatePlatformFeedback(id: number, data: PlatformFeedbackUpdateRequest) {
  return apiRequest<PlatformFeedbackItem>(`/admin/platform-feedback/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
