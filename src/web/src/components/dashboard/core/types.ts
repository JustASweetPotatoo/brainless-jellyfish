export type DashboardPage = "overview" | "modules" | "statistics" | "settings";

export interface BotModule {
  id: string;
  icon: string;
  name: string;
  description: string;
  enabled: boolean;
  tone: string;
}
