import {
  hasAdminRole,
  isAdminRole,
  isTokenExpired,
  sessionFromAccessToken,
  type SessionUser,
} from "./jwt";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: SessionUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function persistSession(accessToken: string, refreshToken: string): SessionUser {
  const user = sessionFromAccessToken(accessToken);

  if (!isAdminRole(user.role) && !hasAdminRole(user.roles)) {
    clearSession();
    throw new Error("Bu panele yalnızca ADMIN rolüne sahip kullanıcılar erişebilir");
  }

  setTokens(accessToken, refreshToken);
  setStoredUser(user);
  return user;
}

export function readSession(): SessionUser | null {
  const accessToken = getAccessToken();
  if (!accessToken) {
    clearSession();
    return null;
  }

  try {
    const user = sessionFromAccessToken(accessToken);

    if (!isAdminRole(user.role) && !hasAdminRole(user.roles)) {
      clearSession();
      return null;
    }

    setStoredUser(user);
    return user;
  } catch {
    const stored = getStoredUser();
    if (stored && (isAdminRole(stored.role) || hasAdminRole(stored.roles))) {
      return stored;
    }
    clearSession();
    return null;
  }
}

export function needsRefresh(accessToken: string): boolean {
  return isTokenExpired(accessToken);
}

export function getUserInitials(user: SessionUser): string {
  const first = user.firstName?.[0] ?? user.email[0] ?? "A";
  const last = user.lastName?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function getUserDisplayName(user: SessionUser): string {
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  return user.email;
}
