import { apiRequest } from "./client";
import type { ProductRequest, ProductResponse } from "./types";

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
