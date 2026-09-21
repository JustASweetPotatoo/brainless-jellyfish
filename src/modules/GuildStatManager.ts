import { Guild } from "discord.js";
import ClientModule from "./core/ClientModule";
import { ModuleOn, Repository } from "./core/decorators";
import GuildMessageStats from "../database/model/GuildMessageStats";
import GuildMessageStatRepo from "../database/repository/GuildMessageStatRepo";
import { BucketCounter } from "./MessageStats";
import { getDayTimestamp } from "../utils/timestamps";

export default class GuildStatisticsManager extends ClientModule<"guild-statistics-manager"> {
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
