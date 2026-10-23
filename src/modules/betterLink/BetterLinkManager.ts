import { PremiumStatus } from "../../database/model/GuildStatus";
import DiscordModule from "../core/module/DiscordModule";
import { ModuleMap } from "../core/ModuleManager";

export default class BetterLinkManager extends DiscordModule<"better-link-manager"> {
  readonly webManaged: boolean = true;
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  async check<TName extends keyof ModuleMap>(name: TName, guildId: string) {
    return !!(await this.client.guildStatusManager.isActive(guildId, name));
  }
}
