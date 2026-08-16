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
  purchaseType?: string;
  startsAt: string;
  expiresAt: string;
  purchasedAt: string;
  expired: boolean;
  usable: boolean;
}

export interface UserEntitlementResponse {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  purchaseId: number;
  totalQuantity?: number | null;
  remainingQuantity?: number | null;
  usedQuantity?: number | null;
  unlimited: boolean;
  startsAt?: string;
  expiresAt?: string;
  lastUsage?: string;
  purchaseStatus?: PurchaseStatus;
  expired: boolean;
  usable: boolean;
  createdAt?: string;
}

export interface PurchaseFulfillmentResponse {
  id: number;
  installmentId?: string;
  installmentNumber?: number;
  installmentCount?: number;
  status: string;
  startsAt?: string;
  expiresAt?: string;
  dueAt?: string;
  amount?: number;
  currency?: string;
  failureReason?: string;
}

export interface PurchaseSummaryResponse {
  purchaseId: number;
  userId: number;
  packageId: number;
  packageCode: string;
  packageName: string;
  price: number;
  currency: string;
  status: PurchaseStatus;
  paymentMode?: string;
  paymentStyle?: string;
  purchaseType?: string;
  installmentCount?: number;
  paymentId?: string;
  paymentConversationId?: string;
  cardBrand?: string;
  cardLastFour?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  billingPeriod?: string;
  cancelAtPeriodEnd?: boolean;
  manualPaymentRequired?: boolean;
  refundEligible?: boolean;
  refundableAmount?: number;
  startsAt: string;
  expiresAt: string;
  purchasedAt: string;
  daysUntilExpiry?: number;
  expired: boolean;
  usable: boolean;
  products: UserEntitlementResponse[];
  installments: PurchaseFulfillmentResponse[];
}

export type UserRole = "USER" | "WAITER";
export type AuthProvider = "BASIC" | "GOOGLE";

export interface UserUpdateRequest {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
}

export interface UserSummaryResponse {
  id: number;
  firstName: string;
  lastName?: string;
  displayName: string;
  email: string;
  phone?: string;
  provider: AuthProvider;
  role: UserRole;
  createdAt: string;
}

export interface UserPageResponse {
  content: UserSummaryResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface UserDetailResponse extends UserSummaryResponse {
  updatedAt: string;
  trialUsed: boolean;
  trialEndDate?: string | null;
  registrationIpAddress?: string;
  registrationDevice?: string;
  registrationDeviceType?: string;
  activePackage?: string | null;
  products: string[];
  scopes: string[];
  qrCount: number;
  activeMenuCount: number;
  purchases: PurchaseResponse[];
}

export interface ImpersonateResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  email: string;
  firstName: string;
  lastName?: string;
  impersonatorUserId: number;
}

export interface ExtendTrialRequest {
  days: number;
}

export interface ExtendTrialResponse {
  purchaseId: number;
  packageName: string;
  expiresAt: string;
  daysAdded: number;
}
