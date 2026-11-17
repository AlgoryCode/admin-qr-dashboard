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
  priority: TicketPriority;
  assigneeId: number | null;
  assigneeName: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
}

export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  LOW: { label: "Düşük", className: "text-muted-foreground" },
  NORMAL: { label: "Normal", className: "" },
  HIGH: {
    label: "Yüksek",
    className: "border-amber-500/30 text-amber-700 dark:text-amber-300",
  },
  URGENT: {
    label: "Acil",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

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
  priority?: TicketPriority;
  assigneeId?: number;
  unassign?: boolean;
}

export type TicketMessage = {
  id: number;
  authorName: string | null;
  body: string;
  internal: boolean;
  emailed: boolean;
  createdAt: string;
};

export type TicketSummary = {
  open: number;
  inProgress: number;
  unassigned: number;
  urgent: number;
  avgFirstResponseHours: number | null;
  resolvedLast30Days: number;
};

export const getTicketSummary = () =>
  apiRequest<TicketSummary>("/admin/platform-feedbacks/summary");

export const listTicketMessages = (id: number) =>
  apiRequest<TicketMessage[]>(`/admin/platform-feedbacks/${id}/messages`);

export const postTicketMessage = (
  id: number,
  body: string,
  internal: boolean,
) =>
  apiRequest<TicketMessage>(`/admin/platform-feedbacks/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body, internal }),
  });

export const DEFAULT_PAGE_SIZE = 10;

export function listPlatformFeedback(
  page = 0,
  size = DEFAULT_PAGE_SIZE,
  params?: {
    status?: PlatformFeedbackStatus;
    q?: string;
    priority?: TicketPriority;
    /** 0 = unassigned */
    assigneeId?: number;
  },
) {
  const search = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (params?.status) search.set("status", params.status);
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.priority) search.set("priority", params.priority);
  if (params?.assigneeId != null)
    search.set("assigneeId", String(params.assigneeId));

  return apiRequest<PlatformFeedbackPageResponse>(
    `/admin/platform-feedbacks?${search.toString()}`,
  );
}

export function getPlatformFeedback(id: number) {
  return apiRequest<PlatformFeedbackItem>(`/admin/platform-feedbacks/${id}`);
}

export function updatePlatformFeedback(
  id: number,
  data: PlatformFeedbackUpdateRequest,
) {
  return apiRequest<PlatformFeedbackItem>(`/admin/platform-feedbacks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
