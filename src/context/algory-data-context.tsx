"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAdminPackages } from "@/lib/api/packages";
import { getProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import type { PlanPackageResponse, ProductResponse } from "@/lib/api/types";

interface AlgoryDataContextValue {
  products: ProductResponse[];
  packages: PlanPackageResponse[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AlgoryDataContext = createContext<AlgoryDataContextValue | null>(null);

export function AlgoryDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [packages, setPackages] = useState<PlanPackageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsData, packagesData] = await Promise.all([
        getProducts(),
        getAdminPackages(),
      ]);
      setProducts(productsData);
      setPackages(packagesData);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Veriler yüklenemedi";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ products, packages, isLoading, error, refresh }),
    [products, packages, isLoading, error, refresh]
  );

  return (
    <AlgoryDataContext.Provider value={value}>{children}</AlgoryDataContext.Provider>
  );
}

export function useAlgoryData() {
  const context = useContext(AlgoryDataContext);
  if (!context) {
    throw new Error("useAlgoryData must be used within AlgoryDataProvider");
  }
  return context;
}
