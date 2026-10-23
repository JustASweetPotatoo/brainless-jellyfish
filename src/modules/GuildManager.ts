import DiscordModule from "./core/module/DiscordModule";
import { PremiumStatus } from "../database/model/GuildStatus";

export interface ServerSummary {
  id: string;
  name: string;
  iconUrl?: string;
  members: string;
  initials: string;
  color: string;
  admin?: boolean;
}

export default class GuildManager extends DiscordModule<"guild-manager"> {
  readonly webManaged: boolean = true;
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  async getServersSummaryAdminOnly(): Promise<ServerSummary[]> {
    const summary: ServerSummary[] = [];
    this.client.guilds.cache.forEach((guild) =>
      summary.push({
        id: guild.id,
        name: guild.name,
        iconUrl: guild.iconURL()!,
        members: guild.memberCount.toString(),
        color: "",
        initials: "",
      }),
    );

    return summary;
  }
}
