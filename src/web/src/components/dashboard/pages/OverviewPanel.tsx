import type { BotModule } from "../core/types";
import type { DashboardStats } from "../../../api/dashboardApi";
import { Icon, Toggle } from "../core/UI";
import ContentGrid from "./overviewPanel/ContentGrid";
import HeroCard from "./overviewPanel/HeroCard";
import StatGrid from "./overviewPanel/StatGrid";

interface Props {
  serverName: string;
  stats: DashboardStats;
  modules: BotModule[];
  onToggle: (id: string) => Promise<void> | void;
}

export default function OverviewPanel({ serverName, stats, modules, onToggle }: Props) {
  return (
    <div className="grid gap-6">
      <HeroCard serverName={serverName} />
      <StatGrid stats={stats} />
      <ContentGrid modules={modules} stats={stats} onToggle={onToggle} />
    </div>
  );
}
