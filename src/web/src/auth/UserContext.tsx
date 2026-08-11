import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { mockGetSession, mockLogin, mockLogout, mockRefresh } from "./mockAuthAPI";

import type { AuthSession, LoginCredentials, User } from "./types";

interface UserContextValue {
  user: User | null;
  accessToken: string | null;

  isAuthenticated: boolean;
  isLoading: boolean;

  login(credentials: LoginCredentials): Promise<void>;

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
      const session = await mockGetSession();

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
  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await mockLogin(credentials);

    setSession(session);
  }, []);

  /**
   * Refresh access token
   */
  const refresh = useCallback(async () => {
    const session = await mockRefresh();

    setSession(session);
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await mockLogout();
    } finally {
      setSession(null);
    }
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
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
