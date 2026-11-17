import { apiRequest } from "./client";

export type FeatureKind = "BOOLEAN" | "LIMIT" | "METERED" | "CREDIT";
export type ResetPeriod = "NONE" | "DAY" | "WEEK" | "MONTH";

export type Feature = {
  key: string;
  name: string;
  kind: FeatureKind;
  unit: string | null;
  resetPeriod: ResetPeriod;
  parentKey: string | null;
  description: string | null;
  /** Uses per period for merchants with no grant of this feature (METERED only). */
  freeQuota: number | null;
  /** Owning the parent feature makes the allowance unlimited unless a grant sets a number. */
  unlimitedWithParent: boolean;
  countedLive: boolean;
};

export type FeatureRequest = Omit<Feature, "countedLive">;

export const KIND_META: Record<FeatureKind, { label: string; hint: string }> = {
  BOOLEAN: { label: "Açık/kapalı", hint: "Pakette varsa kullanılır." },
  LIMIT: {
    label: "Kapasite",
    hint: "Aynı anda en fazla kaç tane olabileceği; mevcut kayıtlar sayılır.",
  },
  METERED: {
    label: "Dönemlik kota",
    hint: "Her dönem sıfırlanan kullanım hakkı.",
  },
  CREDIT: {
    label: "Kredi",
    hint: "Satın alınan, harcandıkça azalan ve yenilenmeyen birim.",
  },
};

export const RESET_LABEL: Record<ResetPeriod, string> = {
  NONE: "Sıfırlanmaz",
  DAY: "Günlük",
  WEEK: "Haftalık",
  MONTH: "Aylık",
};

export type VersionLine = {
  productId: number;
  productCode: string;
  productName: string;
  featureCode: string;
  quantity: number;
  unlimited: boolean;
};

export type PlanVersion = {
  id: number;
  version: number;
  current: boolean;
  price: number;
  yearlyPrice: number | null;
  currency: string;
  validityDays: number;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  activeSubscribers: number;
  lines: VersionLine[];
};

export function listFeatures() {
  return apiRequest<Feature[]>("/admin/features");
}

export function saveFeature(body: FeatureRequest) {
  return apiRequest<Feature>("/admin/features", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function listPlanVersions(packageId: number) {
  return apiRequest<PlanVersion[]>(`/admin/packages/${packageId}/versions`);
}

export function moveSubscribers(
  packageId: number,
  toVersionId: number,
  fromVersionId?: number,
) {
  return apiRequest<{ moved: number }>(
    `/admin/packages/${packageId}/versions/move`,
    {
      method: "POST",
      body: JSON.stringify({
        toVersionId,
        fromVersionId: fromVersionId ?? null,
      }),
    },
  );
}
