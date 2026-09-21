export type DashboardPage = "overview" | "modules" | "statistics" | "settings" | "audit-log";

export interface BotModule {
  id: string;
  icon: string;
  name: string;
  description: string;
  enabled: boolean;
  pending?: boolean;
  tone: string;
}
