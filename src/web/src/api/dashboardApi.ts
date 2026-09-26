import type { BotModule } from "../components/dashboard/core/types.ts";

export interface ServerSummary {
  id: string;
  name: string;
  members: string;
  initials: string;
  color: string;
}

export interface DashboardStats {
  updatedAt: string;
  memberCount: number;
  onlineCount: number;
  messagesToday: number;
  messagesTotal: number;
  newMembers: number;
  voiceHoursToday: number;
  voiceHoursTotal: number;
  memberGrowthPercent: number;
  onlinePercent: number;
  messageGrowthPercent: number;
  voiceGrowthPercent: number;
  memberGrowth: number[];
  dailyActivity: Array<{ label: string; messages: number; members: number }>;
  topChannels: Array<{ name: string; messages: number; share: number }>;
  recentActivities: Array<{ title: string; meta: string; tone: string; icon: string }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? `API error ${response.status}`);
  }

  return (await response.json()) as T;
}

export const getServers = () => request<ServerSummary[]>("/servers");

export const getServerModules = (serverId: string, signal?: AbortSignal) =>
  request<BotModule[]>(`/servers/${encodeURIComponent(serverId)}/modules`, { signal });

export const getServerStats = (serverId: string, signal?: AbortSignal) =>
  request<DashboardStats>(`/servers/${encodeURIComponent(serverId)}/stats`, { signal });

export const updateServerModule = (serverId: string, moduleId: string, enabled: boolean) =>
  request<BotModule>(
    `/servers/${encodeURIComponent(serverId)}/modules/${encodeURIComponent(moduleId)}`,
    { method: "PATCH", body: JSON.stringify({ enabled }) },
  );
