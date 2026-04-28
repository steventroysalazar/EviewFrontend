// Lightweight client-side auth for the EV12 backend (token stored in localStorage).
// The Lovable Cloud Supabase auth is unrelated to this gateway, so we use a
// dedicated context to avoid coupling.

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { fetchApi, updateGatewayConfig, loadGatewayConfig } from "@/lib/api";

export interface EvUser {
  id?: number | string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userRole?: number | string;
  [key: string]: unknown;
}

interface AuthState {
  isAuthenticated: boolean;
  user: EvUser | null;
  token: string;
}

interface EvAuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (payload: Record<string, unknown>) => Promise<unknown>;
}

const STORAGE_KEY = "ev12-auth-store";
const initial: AuthState = { isAuthenticated: false, user: null, token: "" };

const load = (): AuthState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    if (!parsed?.isAuthenticated) return initial;
    return { isAuthenticated: true, user: parsed.user || null, token: parsed.token || "" };
  } catch {
    return initial;
  }
};

const save = (state: AuthState) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const EvAuthContext = createContext<EvAuthContextValue | undefined>(undefined);

export const EvAuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(load);

  useEffect(() => {
    save(state);
    // Sync gateway storage so the api client can attach the token automatically.
    if (state.token) updateGatewayConfig({ authToken: state.token });
  }, [state]);

  const login = async (email: string, password: string) => {
    const data = await fetchApi<{ token?: string; user?: EvUser } & Record<string, unknown>>(
      "/api/auth/login",
      { method: "POST", body: { email, password } }
    );
    const token = (data?.token as string) || (data as any)?.accessToken || "";
    const user = (data?.user as EvUser) || ((data as any)?.profile as EvUser) || { email };
    if (token) updateGatewayConfig({ authToken: token });
    setState({ isAuthenticated: true, user, token });
  };

  const register = async (payload: Record<string, unknown>) => {
    return fetchApi("/api/auth/register", { method: "POST", body: payload });
  };

  const logout = () => {
    const cfg = loadGatewayConfig();
    delete cfg.authToken;
    localStorage.setItem("ev12:gateway-config", JSON.stringify(cfg));
    setState(initial);
  };

  return (
    <EvAuthContext.Provider value={{ ...state, login, logout, register }}>{children}</EvAuthContext.Provider>
  );
};

export const useEvAuth = () => {
  const ctx = useContext(EvAuthContext);
  if (!ctx) throw new Error("useEvAuth must be used within EvAuthProvider");
  return ctx;
};
