import type { AuthSession } from "./types";

async function authRequest(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`/api/auth${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    credentials: "same-origin",
  });

  return response;
}

export async function getSession(): Promise<AuthSession | null> {
  const response = await authRequest("/session");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Không thể kiểm tra phiên đăng nhập");
  return (await response.json()) as AuthSession;
}

export async function logoutSession(): Promise<void> {
  const response = await authRequest("/logout", { method: "POST" });
  if (!response.ok) throw new Error("Không thể đăng xuất");
}

export function startDiscordLogin(returnTo: string): void {
  const query = new URLSearchParams({ returnTo });
  window.location.assign(`/api/auth/discord/start?${query.toString()}`);
}

async function adminLoginRequest(path: string, body: Record<string, string>): Promise<void> {
  const response = await authRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (response.ok) return;

  const data = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(data?.message ?? "Không thể hoàn tất đăng nhập quản trị.");
}

export function requestAdminLoginToken(email: string): Promise<void> {
  return adminLoginRequest("/admin/request-token", { email });
}

export function verifyAdminLoginToken(email: string, token: string): Promise<void> {
  return adminLoginRequest("/admin/verify-token", { email, token });
}
