import { PremiumStatus } from "../database/model/GuildStatus";
import DiscordModule from "./core/module/DiscordModule";

export default class ClientStatusManager extends DiscordModule<"client-status-manager"> {
  readonly webManaged: boolean = true;
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;
}
