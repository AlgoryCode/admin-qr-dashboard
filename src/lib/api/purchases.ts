import { apiRequest } from "./client";
import type { PurchaseSummaryResponse } from "./types";

export function getPurchaseSummary(purchaseId: number) {
  return apiRequest<PurchaseSummaryResponse>(
    `/admin/purchases/${purchaseId}/summary`
  );
}
