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
import { login as apiLogin, refreshTokens } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { LoginRequest } from "@/lib/api/types";

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
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
        const session = await apiLogin(credentials);
        setUser(session);
        router.replace("/");
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
    [router]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user ? isAdminRole(user.role) || hasAdminRole(user.roles) : false,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
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
