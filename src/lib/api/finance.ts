import { API_BASE, ApiError, apiRequest, getAccessToken } from "./client";

export type RevenueMonth = {
  month: string;
  collected: number;
  refunded: number;
  net: number;
  payments: number;
  newCustomers: number;
  churned: number;
  activeAtStart: number;
  mrr: number;
};

export type RevenueSummary = {
  mrr: number;
  arr: number;
  activeCustomers: number;
  arpa: number;
  churnRateLastMonth: number | null;
  dueNext30Days: number;
  dueNext30Count: number;
  overdueAmount: number;
  overdueCount: number;
  currency: string;
  months: RevenueMonth[];
  byPackage: { packageName: string; customers: number; mrr: number }[];
};

export type InvoiceStatus = "PENDING" | "ISSUED" | "FAILED" | "SKIPPED";
export type InvoiceKind = "SALE" | "REFUND";

export type InvoiceRow = {
  id: number;
  merchantId: number;
  purchaseId: number | null;
  kind: InvoiceKind;
  status: InvoiceStatus;
  description: string | null;
  total: number;
  vatAmount: number | null;
  currency: string;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerTaxId: string | null;
  invoiceNumber: string | null;
  documentUrl: string | null;
  attempts: number;
  lastError: string | null;
  issuedAt: string | null;
  createdAt: string;
};

export type InvoicePage = {
  items: InvoiceRow[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
  pending: number;
  failed: number;
};

export type ReminderRow = {
  id: number;
  kind: "DUE_IN_7" | "DUE_IN_1" | "OVERDUE_7" | "MANUAL";
  email: string;
  sentBy: string;
  sentAt: string;
  periodEnd: string | null;
};

export const REMINDER_KIND_LABEL: Record<ReminderRow["kind"], string> = {
  DUE_IN_7: "Otomatik · 7 gün kala",
  DUE_IN_1: "Otomatik · 1 gün kala",
  OVERDUE_7: "Otomatik · 7 gün gecikme",
  MANUAL: "Elle gönderildi",
};

export function getRevenue(months = 12) {
  return apiRequest<RevenueSummary>(`/admin/revenue?months=${months}`);
}

export function listInvoices(params: {
  status?: InvoiceStatus;
  kind?: InvoiceKind;
  q?: string;
  merchantId?: number;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  return apiRequest<InvoicePage>(`/admin/invoices?${search}`);
}

export function retryInvoice(id: number) {
  return apiRequest<InvoiceRow>(`/admin/invoices/${id}/retry`, {
    method: "POST",
  });
}

export function listReminders(merchantId: number) {
  return apiRequest<ReminderRow[]>(`/admin/billing/reminders/${merchantId}`);
}

export function sendReminder(merchantId: number) {
  return apiRequest<ReminderRow>(`/admin/billing/reminders/${merchantId}`, {
    method: "POST",
  });
}

export type ExportKind =
  "members" | "billing" | "payments" | "invoices" | "revenue";

/** Downloads a CSV through the authenticated API and hands it to the browser. */
export async function downloadExport(
  kind: ExportKind,
  range: { from?: string; to?: string } = {},
) {
  const search = new URLSearchParams();
  if (range.from) search.set("from", range.from);
  if (range.to) search.set("to", range.to);
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/admin/exports/${kind}?${search}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.message ?? `Dışa aktarma başarısız (${res.status})`,
    );
  }
  const blob = await res.blob();
  const name =
    /filename="([^"]+)"/.exec(
      res.headers.get("content-disposition") ?? "",
    )?.[1] ?? `algory-${kind}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
