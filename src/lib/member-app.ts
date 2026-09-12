import type { ImpersonateResponse } from "@/lib/api/types";

export const MEMBER_APP_URL = (
  process.env.NEXT_PUBLIC_MEMBER_APP_URL?.trim() || "http://localhost:3000"
).replace(/\/$/, "");

export function buildMemberImpersonationUrl(response: ImpersonateResponse): string {
  const hash = new URLSearchParams({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: String(response.userId),
    email: response.email,
    firstName: response.firstName,
    ...(response.lastName ? { lastName: response.lastName } : {}),
  }).toString();

  return `${MEMBER_APP_URL}/auth/impersonate#${hash}`;
}

export function openMemberImpersonation(response: ImpersonateResponse) {
  window.open(buildMemberImpersonationUrl(response), "_blank", "noopener,noreferrer");
}
