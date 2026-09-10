import { apiRequest } from "./client";
import type {
  PaymentDetailResponse,
  PaymentPageResponse,
  PaymentRefundRequest,
  PaymentRefundResponse,
} from "./types";

export const PAYMENTS_PAGE_SIZE = 20;

export type PaymentListParams = {
  page?: number;
  size?: number;
  q?: string;
  status?: string;
  paymentType?: string;
  paymentStyle?: string;
  accountId?: string;
  createdFrom?: string;
  createdTo?: string;
  verificationOnly?: boolean;
};

export function listPayments(params: PaymentListParams = {}) {
  const search = new URLSearchParams({
    page: String(params.page ?? 0),
    size: String(params.size ?? PAYMENTS_PAGE_SIZE),
  });

  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.status) search.set("status", params.status);
  if (params.paymentType) search.set("paymentType", params.paymentType);
  if (params.paymentStyle) search.set("paymentStyle", params.paymentStyle);
  if (params.accountId?.trim()) search.set("accountId", params.accountId.trim());
  if (params.createdFrom) search.set("createdFrom", params.createdFrom);
  if (params.createdTo) search.set("createdTo", params.createdTo);
  if (params.verificationOnly != null) {
    search.set("verificationOnly", String(params.verificationOnly));
  }

  return apiRequest<PaymentPageResponse>(`/admin/payments?${search.toString()}`);
}

export function getPayment(conversationId: string) {
  return apiRequest<PaymentDetailResponse>(
    `/admin/payments/${encodeURIComponent(conversationId)}`
  );
}

export function refundPayment(
  conversationId: string,
  body?: PaymentRefundRequest
) {
  return apiRequest<PaymentRefundResponse>(
    `/admin/payments/${encodeURIComponent(conversationId)}/refunds`,
    {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }
  );
}
