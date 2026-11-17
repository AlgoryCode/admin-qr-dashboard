/** Upper-snake product identifier, e.g. QR_MENU, SMART_REPORTING. */
export type ProductCode = string;

export type PurchaseStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string>;
}

export interface LoginRequest {
  /** Username, or an e-mail address for accounts that have no username. */
  username: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type ProductType = "PACKAGE_PRODUCT" | "ADDON_PRODUCT";
export type ProductBillingType = "RECURRING" | "ONE_TIME";

/** A feature or panel scope code the application checks, with a label for the admin form. */
export interface CatalogCodeOption {
  code: string;
  label: string;
}

export interface CatalogCodes {
  features: CatalogCodeOption[];
  scopes: CatalogCodeOption[];
}

/** A sellable right. `code` never changes; `featureCode` is what entitlements and access checks use. */
export interface ProductRequest {
  code: ProductCode;
  name: string;
  description?: string;
  type: ProductType;
  featureCode?: string;
  scopeCode?: string;
  unitPrice: number;
  vatRate?: number;
  billingType: ProductBillingType;
  consumable: boolean;
  addonPurchasable: boolean;
  active: boolean;
}

export interface ProductResponse {
  id: number;
  code: ProductCode;
  name: string;
  description?: string | null;
  type: ProductType;
  featureCode?: string | null;
  scopeCode?: string | null;
  unitPrice: number;
  vatRate: number;
  priceWithVat: number;
  billingType: ProductBillingType;
  consumable: boolean;
  addonPurchasable: boolean;
  active: boolean;
  /** How many packages include this product. */
  packageCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PlanPackageItemRequest {
  productId: number;
  quantity: number;
  unlimited: boolean;
}

/** Package price is the sum of its lines (with VAT); discounts and the yearly price are set here. */
export interface PlanPackageRequest {
  code: string;
  name: string;
  description?: string;
  features?: string[];
  monthlyDiscount?: number;
  yearlyPrice?: number | null;
  yearlyDiscount?: number;
  currency?: string;
  validityDays: number;
  priority?: number;
  purchasable: boolean;
  active: boolean;
  items: PlanPackageItemRequest[];
}

export interface PlanPackageItemResponse {
  id: number;
  productId: number;
  productCode: ProductCode;
  productName: string;
  featureCode?: string | null;
  productType: ProductType;
  quantity: number;
  unlimited: boolean;
  lineTotal: number;
}

export interface PlanPackageResponse {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  features: string[];
  subtotal: number;
  vatAmount: number;
  price: number;
  monthlyDiscount: number;
  effectiveMonthlyPrice: number;
  yearlyPrice?: number | null;
  yearlyDiscount: number;
  effectiveYearlyPrice?: number | null;
  currency: string;
  validityDays: number;
  priority: number;
  purchasable: boolean;
  active: boolean;
  /** Free and trial packages: always active, never sold. */
  systemManaged: boolean;
  currentVersionId: number | null;
  items: PlanPackageItemResponse[];
  createdAt: string;
  updatedAt?: string | null;
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
export type AuthProvider = "BASIC" | "GOOGLE" | "MOBILE_GOOGLE";

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
  /** Admin labels. */
  tags?: string[];
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
  trialLifecycle?:
    "NEVER_STARTED" | "ACTIVE" | "EXPIRED" | "BLOCKED_BY_PAID" | null;
  trialConsumed?: boolean;
  trialExpiresAt?: string | null;
  registrationIpAddress?: string;
  registrationDevice?: string;
  registrationDeviceType?: string;
  activePackage?: string | null;
  products: string[];
  scopes: string[];
  qrCount: number;
  activeMenuCount: number;
  purchases: PurchaseResponse[];
  emailVerified?: boolean | null;
}

export interface PasswordResetResponse {
  temporaryPassword: string;
  emailed: boolean;
}

export interface ImpersonateResponse {
  accessToken: string;
  refreshToken: string;
  merchantId: number;
  email: string;
  firstName: string;
  lastName?: string;
  impersonatorUserId: number;
}

export interface ExtendTrialRequest {
  days: number;
}

export interface ExtendTrialResponse {
  purchaseId: number | null;
  packageName: string;
  expiresAt: string;
  daysAdded: number;
}

export interface EndTrialResponse {
  purchaseId: number | null;
  packageName: string;
  expiresAt: string;
}

export interface ReactivatePackageRequest {
  days: number;
}

export interface PackageLifecycleResponse {
  purchaseId: number | null;
  packageName: string;
  status: PurchaseStatus;
  expiresAt: string;
  daysAdded?: number | null;
}

export type PaymentStatus = "INITIATED" | "SUCCESS" | "FAILURE" | "REFUNDED";

export interface PaymentSummaryResponse {
  conversationId: string;
  paymentId?: string | null;
  paymentTransactionId?: string | null;
  accountId?: string | null;
  userId?: number | null;
  buyerEmail?: string | null;
  buyerName?: string | null;
  serviceName?: string | null;
  sourceReferenceId?: string | null;
  price?: number | null;
  paidPrice?: number | null;
  refundedAmount?: number | null;
  remainingAmount?: number | null;
  currency?: string | null;
  status: string;
  paymentType?: string | null;
  paymentStyle?: string | null;
  verificationOnly?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  purchaseId?: number | null;
  packageName?: string | null;
  refundEligible?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PaymentDetailResponse extends PaymentSummaryResponse {
  basketId?: string | null;
  bankInstallmentCount?: number | null;
  subscriptionId?: string | null;
  billingCycleNumber?: number | null;
  packageCode?: string | null;
}

export interface PaymentPageResponse {
  content: PaymentSummaryResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PaymentRefundRequest {
  amount?: number;
}

export interface PaymentRefundResponse {
  conversationId: string;
  paymentTransactionId?: string | null;
  refundedPrice?: number | null;
  status?: string | null;
  purchaseId?: number | null;
}

export type CouponDiscountType = "PERCENT" | "AMOUNT";
export type CouponStatus = "UNUSED" | "RESERVED" | "USED" | "REVOKED";

export interface CouponResponse {
  id: number;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  expiresAt: string;
  validFrom?: string | null;
  status: CouponStatus;
  reservedPurchaseId?: number | null;
  usedPurchaseId?: number | null;
  usedByUserId?: number | null;
  usedAt?: string | null;
  createdByAdminId?: number | null;
  createdAt: string;
}

export interface CouponCreateRequest {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  expiresAt: string;
}

export interface CouponPageResponse {
  content: CouponResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

// --- Billing standing (admin /admin/billing/accounts) ---

export type BillingStanding = "PAID" | "DUE_SOON" | "OVERDUE" | "LAPSED";

export type BillingAccountSort =
  "DUE_ASC" | "DUE_DESC" | "AMOUNT_DESC" | "LAST_PAID_DESC";

export interface BillingAccountRow {
  merchantId: number;
  merchantName: string | null;
  email: string | null;
  phone: string | null;
  purchaseId: number;
  packageCode: string | null;
  packageName: string | null;
  billingPeriod: "MONTHLY" | "YEARLY" | "ONE_TIME" | null;
  paymentStyle: "ONE_TIME" | "SUBSCRIPTION" | null;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  standing: BillingStanding;
  subscriptionStatus: string | null;
  renewalAmount: number | null;
  outstandingAmount: number | null;
  currency: string | null;
  lastPaidAt: string | null;
  periodEndsAt: string | null;
  daysUntilDue: number | null;
  graceEndsAt: string | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  collectionCaseId: number | null;
  collectionStatus: CollectionStatus | null;
  collectionStatusAt: string | null;
}

export interface BillingAccountSummary {
  paid: number;
  dueSoon: number;
  overdue: number;
  lapsed: number;
  dueSoonAmount: number;
  overdueAmount: number;
  dueWithinDays: number;
  openCollections: number;
}

export interface BillingAccountPage {
  content: BillingAccountRow[];
  summary: BillingAccountSummary;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

// --- Collection follow-up (admin /admin/billing/collections) ---

export type CollectionStatus =
  | "AWAITING_PAYMENT"
  | "REMINDED"
  | "UNPAID"
  | "FORMAL_NOTICE"
  | "PAYMENT_PLAN"
  | "LEGAL_FOLLOW_UP"
  | "PAID"
  | "WRITTEN_OFF"
  | "CANCELLED";

export interface CollectionEventResponse {
  id: number;
  fromStatus: CollectionStatus | null;
  toStatus: CollectionStatus;
  note: string | null;
  actor: string;
  createdAt: string;
}

export interface CollectionCaseResponse {
  id: number;
  merchantId: number;
  purchaseId: number | null;
  status: CollectionStatus;
  amount: number | null;
  currency: string | null;
  dueSince: string | null;
  openedAt: string;
  statusAt: string;
  closedAt: string | null;
  events: CollectionEventResponse[];
}
