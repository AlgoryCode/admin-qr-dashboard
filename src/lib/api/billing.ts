import { apiRequest } from "./client";
import type {
  BillingAccountPage,
  BillingAccountSort,
  BillingStanding,
  CollectionCaseResponse,
  CollectionStatus,
} from "./types";

export const BILLING_PAGE_SIZE = 20;

/** OPEN: any open collection case; NONE: no open case; or one collection status. */
export type CollectionFilter = "OPEN" | "NONE" | CollectionStatus;

export type BillingAccountParams = {
  standing?: BillingStanding;
  collection?: CollectionFilter;
  q?: string;
  paymentStyle?: "ONE_TIME" | "SUBSCRIPTION";
  dueWithinDays?: number;
  sort?: BillingAccountSort;
  page?: number;
  size?: number;
};

export function listBillingAccounts(params: BillingAccountParams = {}) {
  const search = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? BILLING_PAGE_SIZE),
  });
  if (params.standing) search.set("standing", params.standing);
  if (params.collection) search.set("collection", params.collection);
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.paymentStyle) search.set("paymentStyle", params.paymentStyle);
  if (params.dueWithinDays)
    search.set("dueWithinDays", String(params.dueWithinDays));
  if (params.sort) search.set("sort", params.sort);
  return apiRequest<BillingAccountPage>(
    `/admin/billing/accounts?${search.toString()}`,
  );
}

export function getCollection(caseId: number) {
  return apiRequest<CollectionCaseResponse>(
    `/admin/billing/collections/${caseId}`,
  );
}

export function openCollection(merchantId: number, note?: string) {
  return apiRequest<CollectionCaseResponse>("/admin/billing/collections", {
    method: "POST",
    body: JSON.stringify({ merchantId, note: note?.trim() || undefined }),
  });
}

/** Changes the status, adds a note, or both (status omitted = note only). */
export function recordCollectionEvent(
  caseId: number,
  body: { status?: CollectionStatus; note?: string },
) {
  return apiRequest<CollectionCaseResponse>(
    `/admin/billing/collections/${caseId}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        status: body.status,
        note: body.note?.trim() || undefined,
      }),
    },
  );
}
