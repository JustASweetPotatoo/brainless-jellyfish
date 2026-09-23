import { PremiumStatus } from "../database/model/GuildStatus";
import DiscordModule from "./core/module/DiscordModule";

export default class ClientStatusManager extends DiscordModule<"client-status-manager"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;
}
