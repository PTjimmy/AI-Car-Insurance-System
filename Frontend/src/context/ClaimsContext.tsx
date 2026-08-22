/**
 * ClaimsContext — wraps the customer claims API.
 * Replaces the old static mock data from src/data/claims.ts.
 * Only used by customer-facing pages. Officer and Admin pages
 * call the API directly.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Claim, customerApi } from "../lib/api";
import { useAuth } from "./AuthContext";

interface ClaimsContextType {
  claims: Claim[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ClaimsContext = createContext<ClaimsContextType | undefined>(undefined);

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || user?.role !== "CUSTOMER") return;
    setLoading(true);
    setError(null);
    try {
      const data = await customerApi.getClaims();
      setClaims(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ claims, loading, error, refresh }),
    [claims, loading, error, refresh]
  );

  return <ClaimsContext.Provider value={value}>{children}</ClaimsContext.Provider>;
}

export function useClaims(): ClaimsContextType {
  const ctx = useContext(ClaimsContext);
  if (!ctx) throw new Error("useClaims must be used inside ClaimsProvider");
  return ctx;
}
