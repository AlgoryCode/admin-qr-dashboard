import { apiRequest } from "./client";
import type { PlanPackageRequest, PlanPackageResponse } from "./types";

export function getAdminPackages() {
  return apiRequest<PlanPackageResponse[]>("/admin/packages");
}

export function getPublicPackages() {
  return apiRequest<PlanPackageResponse[]>("/packages");
}

export function getPackage(id: number) {
  return apiRequest<PlanPackageResponse>(`/admin/packages/${id}`);
}

export function createPackage(data: PlanPackageRequest) {
  return apiRequest<PlanPackageResponse>("/admin/packages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePackage(id: number, data: PlanPackageRequest) {
  return apiRequest<PlanPackageResponse>(`/admin/packages/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
