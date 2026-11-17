import type { BillingStanding, CollectionStatus } from "./types";
import { apiRequest } from "./client";

export type MemberActivity = {
  at: string;
  kind:
    | "PURCHASE"
    | "ADDON"
    | "REFUND"
    | "GRANT"
    | "GRANT_REVOKED"
    | "NOTE"
    | "ADMIN";
  title: string;
  detail: string | null;
  actor: string | null;
};

export type MemberOverview = {
  merchantId: number;
  standing: BillingStanding | null;
  packageName: string | null;
  periodEndsAt: string | null;
  daysUntilDue: number | null;
  totalPaid: number;
  totalRefunded: number;
  paidPurchases: number;
  currency: string;
  firstPaidAt: string | null;
  lastPaidAt: string | null;
  collectionCaseId: number | null;
  collectionStatus: CollectionStatus | null;
  tags: string[];
  noteCount: number;
  activeGrants: number;
  activity: MemberActivity[];
};

export type MemberNote = {
  id: number;
  body: string;
  pinned: boolean;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TagCount = { tag: string; count: number };

export type GrantableProduct = {
  id: number;
  code: string;
  name: string;
  consumable: boolean;
  billingType: "RECURRING" | "ONE_TIME" | null;
  unitPrice: number | null;
};

export type MemberGrant = {
  id: number;
  purchaseId: number;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  days: number | null;
  reason: string;
  grantedBy: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  active: boolean;
};

export const getMemberOverview = (id: number) =>
  apiRequest<MemberOverview>(`/admin/members/${id}/overview`);

export const listMemberNotes = (id: number) =>
  apiRequest<MemberNote[]>(`/admin/members/${id}/notes`);

export const addMemberNote = (id: number, body: string, pinned = false) =>
  apiRequest<MemberNote>(`/admin/members/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ body, pinned }),
  });

export const updateMemberNote = (
  id: number,
  noteId: number,
  patch: { body?: string; pinned?: boolean },
) =>
  apiRequest<MemberNote>(`/admin/members/${id}/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const deleteMemberNote = (id: number, noteId: number) =>
  apiRequest<void>(`/admin/members/${id}/notes/${noteId}`, {
    method: "DELETE",
  });

export const listAllTags = () => apiRequest<TagCount[]>("/admin/members/tags");

export const setMemberTags = (id: number, tags: string[]) =>
  apiRequest<string[]>(`/admin/members/${id}/tags`, {
    method: "PUT",
    body: JSON.stringify({ tags }),
  });

export const listGrantableProducts = () =>
  apiRequest<GrantableProduct[]>("/admin/grantable-products");

export const listMemberGrants = (id: number) =>
  apiRequest<MemberGrant[]>(`/admin/users/${id}/grants`);

export const createMemberGrant = (
  id: number,
  body: {
    productId: number;
    quantity: number;
    days: number | null;
    reason: string;
  },
) =>
  apiRequest<MemberGrant>(`/admin/users/${id}/grants`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const revokeMemberGrant = (id: number, grantId: number) =>
  apiRequest<MemberGrant>(`/admin/users/${id}/grants/${grantId}/revoke`, {
    method: "POST",
  });

export type MenuTheme = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  previewMeta: { swatch?: string[] | string } | null;
  sortOrder: number;
  active: boolean;
};

export function listThemeCatalog() {
  return apiRequest<MenuTheme[]>("/admin/themes?includeInactive=true");
}

export function listMemberThemes(merchantId: number) {
  return apiRequest<MenuTheme[]>(`/admin/merchants/${merchantId}/themes`);
}

export function replaceMemberThemes(merchantId: number, themeCodes: string[]) {
  return apiRequest<MenuTheme[]>(`/admin/merchants/${merchantId}/themes`, {
    method: "PUT",
    body: JSON.stringify({ themeCodes }),
  });
}

export type EffectiveRight = {
  feature: string;
  name: string;
  kind: "BOOLEAN" | "LIMIT" | "METERED" | "CREDIT";
  unit: string | null;
  limit: number;
  unlimited: boolean;
  used: number | null;
  grants: number;
  validUntil: string | null;
};

export type MemberEntitlements = {
  version: number;
  subscription: {
    packageCode: string | null;
    status: string | null;
    billingStatus: string | null;
    planVersion: number | null;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  lines: EffectiveRight[];
};

export function getMemberEntitlements(merchantId: number) {
  return apiRequest<MemberEntitlements>(
    `/admin/users/${merchantId}/entitlements`,
  );
}
