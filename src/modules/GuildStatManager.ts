import DiscordModule from "./core/module/DiscordModule";
import { PremiumStatus } from "../database/model/GuildStatus";

export default class GuildStatisticsManager extends DiscordModule<"guild-statistics-manager"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  // @Repository()
  // private statisticsRepository!: GuildMessageStatRepo;

  // @ModuleOn("flush-message")
  // private async flushMessage(queue: Map<number, BucketCounter>): Promise<void> {
  //   if (queue.size === 0) return;

  //   await this.statisticsRepository.flush(queue);
  // }

  // async getStatistics(guild: Guild): Promise<GuildMessageStats> {
  //   return this.statisticsRepository.get({ guildId: guild.id, dayTimestamp: getDayTimestamp() });
  // }
}
