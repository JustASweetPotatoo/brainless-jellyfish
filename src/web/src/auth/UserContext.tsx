import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getSession, logoutSession, startDiscordLogin } from "./authAPI";

import type { AuthSession, User } from "./types";

interface UserContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login(returnTo: string): void;

  logout(): Promise<void>;

  refresh(): Promise<void>;
}

export const UserContext = createContext<UserContextValue | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Restore session khi app khởi động
   */
  const restoreSession = useCallback(async () => {
    try {
      const session = await getSession();

      setSession(session);
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * Login
   */
  const login = useCallback((returnTo: string) => startDiscordLogin(returnTo), []);

  /** Reload the server-backed session. */
  const refresh = useCallback(async () => {
    const session = await getSession();

    setSession(session);
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      setSession(null);
    }
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      isLoading,
      login,
      logout,
      refresh,
    }),
    [session, isLoading, login, logout, refresh],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
