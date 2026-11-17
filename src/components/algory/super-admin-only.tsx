"use client";

import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/auth-context";

/** Renders children for super admins; a short notice for every other role. */
export function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.adminRole !== "ADMIN") {
    return (
      <div className="mx-auto mt-16 max-w-sm text-center">
        <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 text-base font-semibold">
          Bu sayfa süper adminlere açık
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Erişim gerekiyorsa bir süper admine yaz.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
