import type { ApiErrorBody } from "./types";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistSession,
  setTokens,
} from "@/lib/auth/session";

export const API_BASE = (process.env.API_BASE_URL ?? "/api").replace(
  /\/$/,
  ""
);

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function clearTokens() {
  clearSession();
}

export { getAccessToken, getRefreshToken, setTokens };

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const data = await rawRequest<{ accessToken: string; refreshToken: string }>(
      "/dashboard/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }
    );
    persistSession(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function handleAuthFailure() {
  clearSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout"));
  }
}

export async function rawRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.message ?? `İstek başarısız (${res.status})`,
      body.errors
    );
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (
    res.status === 401 &&
    !retried &&
    !path.startsWith("/auth/") &&
    !path.startsWith("/dashboard/auth/")
  ) {
    if (!refreshPromise) {
      refreshPromise = tryRefreshTokens().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      return apiRequest<T>(path, options, true);
    }

    handleAuthFailure();
    const body: ApiErrorBody = await res.json().catch(() => ({}));
    throw new ApiError(
      401,
      body.message ?? "Oturum süresi doldu. Lütfen tekrar giriş yapın."
    );
  }

  if (res.status === 403) {
    const body: ApiErrorBody = await res.json().catch(() => ({}));
    throw new ApiError(
      403,
      body.message ?? "Bu işlem için ADMIN yetkisi gerekli."
    );
  }

  if (!res.ok) {
    const body: ApiErrorBody = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.message ?? `İstek başarısız (${res.status})`,
      body.errors
    );
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
