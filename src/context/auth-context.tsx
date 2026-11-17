"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { hasAdminRole, isAdminRole, type SessionUser } from "@/lib/auth/jwt";
import {
  clearSession,
  getAccessToken,
  needsRefresh,
  readSession,
} from "@/lib/auth/session";
import {
  login as apiLogin,
  loginWithMfa as apiLoginWithMfa,
  refreshTokens,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { LoginRequest } from "@/lib/api/types";

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** Resolves with an MFA token when a second step is needed. */
  login: (credentials: LoginRequest) => Promise<{ mfaToken: string } | null>;
  loginWithMfa: (mfaToken: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const bootstrap = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setUser(null);
      return;
    }

    if (needsRefresh(accessToken)) {
      const refreshed = await refreshTokens();
      if (!refreshed) {
        clearSession();
        setUser(null);
        return;
      }
    }

    const session = readSession();
    setUser(session);
  }, []);

  useEffect(() => {
    bootstrap().finally(() => setIsLoading(false));
  }, [bootstrap]);

  useEffect(() => {
    const onLogout = () => {
      clearSession();
      setUser(null);
      router.replace("/login");
    };

    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [router]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        const result = await apiLogin(credentials);
        if ("mfaRequired" in result) return { mfaToken: result.mfaToken };
        setUser(result);
        router.replace("/");
        return null;
      } catch (err) {
        clearSession();
        setUser(null);

        if (err instanceof ApiError) {
          throw new Error(err.message);
        }

        if (err instanceof Error) {
          throw err;
        }

        throw new Error("Giriş yapılamadı.");
      }
    },
    [router],
  );

  const loginWithMfa = useCallback(
    async (mfaToken: string, code: string) => {
      try {
        const session = await apiLoginWithMfa(mfaToken, code);
        setUser(session);
        router.replace("/");
      } catch (err) {
        if (err instanceof Error) throw new Error(err.message);
        throw new Error("Doğrulanamadı.");
      }
    },
    [router],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user
        ? isAdminRole(user.role) || hasAdminRole(user.roles)
        : false,
      login,
      loginWithMfa,
      logout,
    }),
    [user, isLoading, login, loginWithMfa, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
