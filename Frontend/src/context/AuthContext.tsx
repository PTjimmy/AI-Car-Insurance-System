import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type AuthToken, type UserRole, authApi } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  user_id: number;
  email: string;
  role: UserRole;
  full_name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: AuthToken) => void;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
  }) => Promise<void>;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOKEN_KEY = "access_token";
const USER_KEY = "auth_user";

function saveSession(token: AuthToken): void {
  localStorage.setItem(TOKEN_KEY, token.access_token);
  const user: AuthUser = {
    user_id: token.user_id,
    email: token.email,
    role: token.role,
    full_name: token.full_name,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const saved = loadUser();
    const token = localStorage.getItem(TOKEN_KEY);
    if (saved && token) {
      setUser(saved);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const token = await authApi.login(email, password);
    saveSession(token);
    setUser({
      user_id: token.user_id,
      email: token.email,
      role: token.role,
      full_name: token.full_name,
    });
  }, []);

  const register = useCallback(
    async (data: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      password: string;
      address?: string;
    }) => {
      // Register now returns { message, email, requires_verification }
      // NOT a token — the user must verify their email first.
      // The caller (SignUpForm) handles the redirect to /verify-email.
      await authApi.register(data);
    },
    []
  );

  const loginWithToken = useCallback((token: AuthToken) => {
    saveSession(token);
    setUser({
      user_id: token.user_id,
      email: token.email,
      role: token.role,
      full_name: token.full_name,
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      loginWithToken,
      register,
      logout,
    }),
    [user, isLoading, login, loginWithToken, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
