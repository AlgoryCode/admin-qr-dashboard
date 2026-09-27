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

export function buildMemberImpersonationUrl(
  memberAppUrl: string,
  response: ImpersonateResponse,
): string {
  const hash = new URLSearchParams({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: String(response.userId),
    email: response.email,
    firstName: response.firstName,
    ...(response.lastName ? { lastName: response.lastName } : {}),
  }).toString();

  return `${memberAppUrl.replace(/\/$/, "")}/auth/impersonate#${hash}`;
}

export async function openMemberImpersonation(response: ImpersonateResponse) {
  const memberAppUrl = await resolveMemberAppUrl();
  const url = buildMemberImpersonationUrl(memberAppUrl, response);
  window.open(url, "_blank", "noopener,noreferrer");
}
