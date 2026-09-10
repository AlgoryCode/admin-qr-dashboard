import { persistSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/jwt";
import {
  ApiError,
  getRefreshToken,
  rawRequest,
} from "./client";
import type { LoginRequest, TokenPair } from "./types";

export async function login(credentials: LoginRequest): Promise<SessionUser> {
  const data = await rawRequest<TokenPair>("/admin/auth/sessions", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  return persistSession(data.accessToken, data.refreshToken);
}

export async function refreshTokens(): Promise<TokenPair | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const data = await rawRequest<TokenPair>("/admin/auth/sessions/refresh", {
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
