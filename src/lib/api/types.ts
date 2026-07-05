export type ProductCode = "QR_CREATE";

export type PurchaseStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ProductRequest {
  code: ProductCode;
  name: string;
  description?: string;
  active: boolean;
}

export interface ProductResponse {
  id: number;
  code: ProductCode;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface PlanPackageItemRequest {
  productId: number;
  quantity: number;
}

export interface PlanPackageRequest {
  code: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  active: boolean;
  validityDays: number;
  items: PlanPackageItemRequest[];
}

export interface PlanPackageItemResponse {
  id: number;
  productId: number;
  productCode: ProductCode;
  productName: string;
  quantity: number;
}

export interface PlanPackageResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  active: boolean;
  validityDays: number;
  items: PlanPackageItemResponse[];
  createdAt: string;
}

export interface PurchaseResponse {
  id: number;
  userId: number;
  packageId: number;
  packageCode: string;
  packageName: string;
  price: number;
  currency: string;
  status: PurchaseStatus;
  startsAt: string;
  expiresAt: string;
  purchasedAt: string;
  expired: boolean;
  usable: boolean;
}
