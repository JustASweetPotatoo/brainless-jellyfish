import type { AuthSession, LoginCredentials } from "./types";

const STORAGE_KEY = "app_auth_session";

const USER = {
  id: "user_001",
  username: "admin",
  email: "admin@example.com",
  displayName: "Administrator",
  avatar: "https://ui-avatars.com/api/?name=Administrator",
};

const PASSWORD = "123456";
const ACCESS_TOKEN_LIFETIME = 30 * 60 * 1000;
const SESSION_LIFETIME = 30 * 24 * 60 * 60 * 1000;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const token = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

const getSession = (): AuthSession | null => {
  const value = localStorage.getItem(STORAGE_KEY);

  if (!value) return null;

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const setSession = (session: AuthSession) => localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

const clearSession = () => localStorage.removeItem(STORAGE_KEY);

export async function mockLogin(credentials: LoginCredentials): Promise<AuthSession> {
  await delay(500);

  if (credentials.username !== USER.username || credentials.password !== PASSWORD) {
    throw new Error("Invalid username or password");
  }

  const now = Date.now();

  const session: AuthSession = {
    user: USER,
    accessToken: token("access"),
    accessTokenExpiresAt: now + ACCESS_TOKEN_LIFETIME,
    refreshToken: token("refresh"),
    refreshTokenExpiresAt: now + SESSION_LIFETIME,
  };

  setSession(session);

  return session;
}

export async function mockGetSession(): Promise<AuthSession> {
  await delay(300);

  const session = getSession();

  if (!session) {
    throw new Error("No session");
  }

  if (session.refreshTokenExpiresAt <= Date.now()) {
    clearSession();
    throw new Error("Session expired");
  }

  return session;
}

export async function mockRefresh(): Promise<AuthSession> {
  await delay(300);

  const session = getSession();

  if (!session) {
    throw new Error("No session");
  }

  if (session.refreshTokenExpiresAt <= Date.now()) {
    clearSession();
    throw new Error("Session expired");
  }

  const refreshed: AuthSession = {
    ...session,
    accessToken: token("access"),
    accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_LIFETIME,
  };

  setSession(refreshed);

  return refreshed;
}

export async function mockLogout(): Promise<void> {
  await delay(200);
  clearSession();
}
