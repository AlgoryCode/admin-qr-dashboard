import { apiRequest } from "./client";
import type { CouponCreateRequest, CouponPageResponse, CouponResponse, CouponStatus } from "./types";

const DEFAULT_PAGE_SIZE = 10;

export function listCoupons(page = 0, size = DEFAULT_PAGE_SIZE, query?: string, status?: CouponStatus) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const trimmed = query?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }
  if (status) {
    params.set("status", status);
  }
  return apiRequest<CouponPageResponse>(`/admin/coupons?${params.toString()}`);
}

export function createCoupon(data: CouponCreateRequest) {
  return apiRequest<CouponResponse>("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function revokeCoupon(id: number) {
  return apiRequest<CouponResponse>(`/admin/coupons/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "REVOKED" }),
  });
}

export { DEFAULT_PAGE_SIZE as COUPONS_PAGE_SIZE };
