import { apiRequest } from "./client";
import type { CatalogCodes, ProductRequest, ProductResponse } from "./types";

export function getProducts() {
  return apiRequest<ProductResponse[]>("/admin/products");
}

export function getProduct(id: number) {
  return apiRequest<ProductResponse>(`/admin/products/${id}`);
}

export function createProduct(data: ProductRequest) {
  return apiRequest<ProductResponse>("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: number, data: ProductRequest) {
  return apiRequest<ProductResponse>(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** Feature and scope codes a product may carry; anything else is rejected by the API. */
export function getCatalogCodes() {
  return apiRequest<CatalogCodes>("/admin/catalog-codes");
}
