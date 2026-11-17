import { apiRequest } from "./client";

export type ScheduleStatus =
  "SCHEDULED" | "ACTIVE" | "DONE" | "CANCELLED" | "FAILED";

export type CatalogSchedule = {
  id: number;
  targetType: "PRODUCT" | "PACKAGE";
  targetId: number;
  targetName: string;
  label: string;
  unitPrice: number | null;
  monthlyDiscount: number | null;
  yearlyDiscount: number | null;
  currentListPrice: number | null;
  startsAt: string;
  endsAt: string | null;
  status: ScheduleStatus;
  prevUnitPrice: number | null;
  prevMonthlyDiscount: number | null;
  prevYearlyDiscount: number | null;
  lastError: string | null;
  createdBy: string | null;
  createdAt: string;
  appliedAt: string | null;
  endedAt: string | null;
};

export type CatalogScheduleRequest = {
  targetType: "PRODUCT" | "PACKAGE";
  targetId: number;
  label: string;
  unitPrice?: number;
  monthlyDiscount?: number;
  yearlyDiscount?: number;
  startsAt: string;
  endsAt?: string;
};

export type ShowcaseBadge = "NEW" | "POPULAR" | "DEAL";

export type ShowcaseModule = {
  productId: number;
  code: string;
  name: string;
  description: string | null;
  unitPrice: number;
  active: boolean;
  tagline: string | null;
  badge: ShowcaseBadge | null;
  featured: boolean;
  hidden: boolean;
  sortOrder: number;
};

export const BADGE_LABEL: Record<ShowcaseBadge, string> = {
  NEW: "Yeni",
  POPULAR: "Popüler",
  DEAL: "Fırsat",
};

export function listSchedules() {
  return apiRequest<CatalogSchedule[]>("/admin/price-changes");
}

export function createSchedule(body: CatalogScheduleRequest) {
  return apiRequest<CatalogSchedule>("/admin/price-changes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function cancelSchedule(id: number) {
  return apiRequest<CatalogSchedule>(`/admin/price-changes/${id}/cancel`, {
    method: "POST",
  });
}

export function listShowcase() {
  return apiRequest<ShowcaseModule[]>("/admin/showcase");
}

export function saveShowcase(
  productId: number,
  body: Pick<
    ShowcaseModule,
    "tagline" | "badge" | "featured" | "hidden" | "sortOrder"
  >,
) {
  return apiRequest<ShowcaseModule>(`/admin/showcase/${productId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
