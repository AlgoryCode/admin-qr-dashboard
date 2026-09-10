import { apiRequest } from "./client";
import type { PurchaseResponse, PurchaseSummaryResponse } from "./types";

export function getPurchaseSummary(purchaseId: number) {
  return apiRequest<PurchaseSummaryResponse>(
    `/admin/purchases/${purchaseId}`
  );
}

export function extendSubscription(purchaseId: number, days: number) {
  return apiRequest<PurchaseResponse>(`/admin/purchases/${purchaseId}/subscription`, {
    method: "PATCH",
    body: JSON.stringify({ days }),
  });
}
