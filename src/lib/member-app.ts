import type { ImpersonateResponse } from "@/lib/api/types";

let cachedMemberAppUrl: string | null = null;

async function resolveMemberAppUrl(): Promise<string> {
  if (cachedMemberAppUrl) {
    return cachedMemberAppUrl;
  }
  const response = await fetch("/api/member-app-url", { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error("Üye uygulaması adresi alınamadı.");
  }
  const data = (await response.json()) as { url?: string };
  const url = data.url?.trim().replace(/\/$/, "");
  if (!url) {
    throw new Error("Üye uygulaması adresi yapılandırılmamış.");
  }
  cachedMemberAppUrl = url;
  return url;
}

function resolveMerchantId(response: ImpersonateResponse): number {
  if (Number.isFinite(response.merchantId)) {
    return response.merchantId;
  }
  const legacy = (response as ImpersonateResponse & { userId?: number }).userId;
  if (legacy != null && Number.isFinite(legacy)) {
    return legacy;
  }
  throw new Error("API yanıtında merchantId eksik.");
}

export function buildMemberImpersonationUrl(
  memberAppUrl: string,
  response: ImpersonateResponse,
): string {
  const merchantId = resolveMerchantId(response);
  const hash = new URLSearchParams({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    merchantId: String(merchantId),
    email: response.email,
    firstName: response.firstName,
    ...(response.lastName ? { lastName: response.lastName } : {}),
  }).toString();

  return `${memberAppUrl.replace(/\/$/, "")}/auth/impersonate#${hash}`;
}

export async function openMemberImpersonation(
  response: ImpersonateResponse,
  targetWindow: Window | null = null,
) {
  const memberAppUrl = await resolveMemberAppUrl();
  const url = buildMemberImpersonationUrl(memberAppUrl, response);

  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.replace(url);
    return;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    throw new Error(
      "Tarayıcı yeni sekmeyi engelledi. Pop-up izni verip tekrar deneyin.",
    );
  }
}
