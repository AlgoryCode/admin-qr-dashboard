import { persistSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/jwt";
import { ApiError, getRefreshToken, rawRequest } from "./client";
import type { LoginRequest, TokenPair } from "./types";

export type MfaChallenge = {
  mfaRequired: true;
  mfaToken: string;
  expiresInSeconds: number;
};

/** Signs in, or returns a challenge when the account has two-step verification on. */
export async function login(
  credentials: LoginRequest,
): Promise<SessionUser | MfaChallenge> {
  const data = await rawRequest<TokenPair | MfaChallenge>(
    "/dashboard/auth/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
  );
  if ("mfaRequired" in data && data.mfaRequired) return data;
  const tokens = data as TokenPair;
  return persistSession(tokens.accessToken, tokens.refreshToken);
}

export async function loginWithMfa(
  mfaToken: string,
  code: string,
): Promise<SessionUser> {
  const data = await rawRequest<TokenPair>("/dashboard/auth/login/mfa", {
    method: "POST",
    body: JSON.stringify({ mfaToken, code }),
  });
  return persistSession(data.accessToken, data.refreshToken);
}

export async function refreshTokens(): Promise<TokenPair | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const data = await rawRequest<TokenPair>("/dashboard/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    persistSession(data.accessToken, data.refreshToken);
    return data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return null;
    }
    throw err;
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }
}
