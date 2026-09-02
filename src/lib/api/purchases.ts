import { apiRequest } from "./client";
import type { PurchaseResponse, PurchaseSummaryResponse } from "./types";

export function getPurchaseSummary(purchaseId: number) {
  return apiRequest<PurchaseSummaryResponse>(
    `/admin/purchases/${purchaseId}/summary`
  );
}

export function deactivateSubscription(purchaseId: number) {
  return apiRequest<PurchaseResponse>(`/admin/purchases/${purchaseId}/subscription/deactivate`, {
    method: "POST",
  });
}

export function extendSubscription(purchaseId: number, days: number) {
  return apiRequest<PurchaseResponse>(`/admin/purchases/${purchaseId}/subscription/extend`, {
    method: "POST",
    body: JSON.stringify({ days }),
  });
}
