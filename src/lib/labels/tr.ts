type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

type StatusDisplay = {
  label: string;
  variant: BadgeVariant;
};

function getLabel(key: string, map: Record<string, string>): string {
  return map[key] ?? key;
}

function getStatusDisplay(
  status: string,
  map: Record<string, StatusDisplay>,
  fallbackVariant: BadgeVariant = "outline"
): StatusDisplay {
  return map[status] ?? { label: status, variant: fallbackVariant };
}

const purchaseStatusMap: Record<string, StatusDisplay> = {
  ACTIVE: { label: "Aktif", variant: "default" },
  EXPIRED: { label: "Süresi doldu", variant: "secondary" },
  CANCELLED: { label: "İptal edildi", variant: "secondary" },
};

const installmentStatusMap: Record<string, StatusDisplay> = {
  PAID: { label: "Ödendi", variant: "default" },
  FAILED: { label: "Başarısız", variant: "secondary" },
  PENDING: { label: "Beklemede", variant: "outline" },
  ACTIVE: { label: "Aktif", variant: "default" },
  EXPIRED: { label: "Süresi doldu", variant: "secondary" },
  CANCELLED: { label: "İptal edildi", variant: "secondary" },
};

const userRoleLabels: Record<string, string> = {
  USER: "Kullanıcı",
  WAITER: "Garson",
  ADMIN: "Yönetici",
};

const authProviderLabels: Record<string, string> = {
  BASIC: "E-posta",
  GOOGLE: "Google",
};

const projectStatusMap: Record<string, StatusDisplay> = {
  active: { label: "Aktif", variant: "default" },
  paused: { label: "Duraklatıldı", variant: "secondary" },
  archived: { label: "Arşivlendi", variant: "outline" },
};

const billingPeriodLabels: Record<string, string> = {
  monthly: "Aylık",
  yearly: "Yıllık",
  "one-time": "Tek seferlik",
  ONE_TIME: "Tek seferlik",
  MONTHLY: "Aylık",
  YEARLY: "Yıllık",
};

const paymentFieldLabels: Record<string, string> = {
  SUBSCRIPTION: "Abonelik",
  ONE_TIME: "Tek seferlik",
  INSTALLMENT: "Taksitli",
  RECURRING: "Yinelenen",
  CARD: "Kart",
  ACTIVE: "Aktif",
  EXPIRED: "Süresi doldu",
  CANCELLED: "İptal edildi",
  CANCELED: "İptal edildi",
  PENDING: "Beklemede",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  TRIALING: "Deneme",
  PAST_DUE: "Gecikmiş",
  UNPAID: "Ödenmedi",
};

export function getPurchaseStatusDisplay(status: string): StatusDisplay {
  return getStatusDisplay(status, purchaseStatusMap);
}

export function getInstallmentStatusDisplay(status: string): StatusDisplay {
  return getStatusDisplay(status, installmentStatusMap);
}

export function getUserRoleLabel(role: string): string {
  return getLabel(role, userRoleLabels);
}

export function getAuthProviderLabel(provider: string): string {
  return getLabel(provider, authProviderLabels);
}

export function getProjectStatusDisplay(status: string): StatusDisplay {
  return getStatusDisplay(status, projectStatusMap, "outline");
}

export function getBillingPeriodLabel(period: string): string {
  return getLabel(period, billingPeriodLabels);
}

export function getPaymentFieldLabel(value: string): string {
  return getLabel(value, paymentFieldLabels);
}

export function formatPaymentFields(
  ...values: (string | null | undefined)[]
): string {
  const labels = values.filter(Boolean).map((v) => getPaymentFieldLabel(v!));
  return labels.length > 0 ? labels.join(" · ") : "—";
}

export function formatSubscriptionDisplay(
  subscriptionStatus?: string | null,
  billingPeriod?: string | null
): string {
  if (!subscriptionStatus) return "—";
  const statusLabel = getPaymentFieldLabel(subscriptionStatus);
  const periodLabel = billingPeriod ? getBillingPeriodLabel(billingPeriod) : null;
  return periodLabel ? `${statusLabel} · ${periodLabel}` : statusLabel;
}
