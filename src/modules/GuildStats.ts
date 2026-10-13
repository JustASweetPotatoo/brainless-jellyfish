import { Events, GuildMember, Interaction } from "discord.js";

import DiscordModule from "./core/module/DiscordModule";
import { PremiumStatus } from "../database/model/GuildStatus";
import { On } from "./core/decorators/decorators";
import { getHourTimestamp, getMinuteTimestamp } from "../utils/timestamps";

export default class GuildStatisticsManager extends DiscordModule<"guild-statistics-manager"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  @On(Events.GuildMemberAdd)
  async onGuildMemberJoin(member: GuildMember) {
    const key = `stats:member:join:${getMinuteTimestamp()}`;
    const field = member.guild.id;
    this.redisClient.hIncrBy(key, field, 1);
  }

  @On(Events.GuildMemberRemove)
  async onGuildMemberLeave(member: GuildMember) {
    const key = `stats:member:leave:${getMinuteTimestamp()}`;
    const field = member.guild.id;
    this.redisClient.hIncrBy(key, field, 1);
  }
}
