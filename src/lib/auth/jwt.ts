export type UserRole = "ADMIN" | "USER";

export interface JwtClaims {
  jti?: string;
  sub?: string;
  userId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole | string;
  roles?: string[];
  typ?: string;
  sessionId?: string;
  loggedInAt?: string;
  accessExpiresAt?: string;
  exp?: number;
  iat?: number;
}

export interface SessionUser {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  roles: string[];
  sessionId?: string;
  loggedInAt?: string;
  accessExpiresAt?: string;
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

export function decodeJwtPayload(token: string): JwtClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Geçersiz token formatı");
  }

  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtClaims;
  } catch {
    throw new Error("Token çözümlenemedi");
  }
}

function normalizeRoles(claims: JwtClaims): string[] {
  const fromArray = claims.roles ?? [];
  const fromSingle = claims.role ? [claims.role] : [];
  return [...fromArray, ...fromSingle];
}

function resolveRole(roles: string[]): UserRole | null {
  if (roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN")) return "ADMIN";
  if (roles.some((r) => r === "ROLE_USER" || r === "USER")) return "USER";
  return null;
}

function resolveEmail(claims: JwtClaims): string | null {
  if (claims.email) return claims.email;
  if (claims.sub?.includes("@")) return claims.sub;
  return null;
}

export function sessionFromAccessToken(accessToken: string): SessionUser {
  const claims = decodeJwtPayload(accessToken);
  const roles = normalizeRoles(claims);
  const role = resolveRole(roles);

  if (!role) {
    throw new Error("Token içinde rol bilgisi bulunamadı");
  }

  const email = resolveEmail(claims);
  const userId = claims.userId;

  if (!email || userId == null) {
    throw new Error("Token içinde oturum bilgileri eksik");
  }

  return {
    userId,
    email,
    firstName: claims.firstName,
    lastName: claims.lastName,
    role,
    roles,
    sessionId: claims.sessionId ?? claims.jti,
    loggedInAt: claims.loggedInAt,
    accessExpiresAt: claims.accessExpiresAt,
  };
}

export function isAdminRole(role: UserRole | string | undefined): boolean {
  return role === "ADMIN" || role === "ROLE_ADMIN";
}

export function hasAdminRole(roles: string[] | undefined): boolean {
  return roles?.some((r) => r === "ROLE_ADMIN" || r === "ADMIN") ?? false;
}

export function isTokenExpired(accessToken: string): boolean {
  try {
    const { exp } = decodeJwtPayload(accessToken);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}
