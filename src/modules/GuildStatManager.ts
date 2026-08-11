import { Events, Guild, GuildMember, Message } from "discord.js";
import ClientModule from "./core/ClientModule";
import { ModuleOptions } from "./core/BaseModule";
import { On, Repository } from "./core/decorators";
import GuildStatistics from "../database/model/GuildStatistics";
import GuildStatisticsRepo from "../database/repository/GuildStatisticsRepo";

export default class GuildStatisticsManager extends ClientModule<"guild-statistics-manager"> {
  static readonly moduleName = "guild-statistics-manager";

  @Repository()
  private statisticsRepository!: GuildStatisticsRepo;

  @On(Events.MessageCreate)
  protected async onMessageCreate(message: Message): Promise<void> {
    if (!message.guildId || message.author.bot) return;

    await this.statisticsRepository.increment(message.guildId, "message_count");
  }

  @On(Events.GuildMemberAdd)
  protected async onGuildMemberAdd(member: GuildMember): Promise<void> {
    if (member.user.bot) return;

    await this.statisticsRepository.increment(member.guild.id, "member_join_count");
  }

  @On(Events.GuildMemberRemove)
  protected async onGuildMemberRemove(member: GuildMember): Promise<void> {
    if (member.user.bot) return;

    await this.statisticsRepository.increment(member.guild.id, "member_leave_count");
  }

  async getStatistics(guild: Guild): Promise<GuildStatistics> {
    return this.statisticsRepository.get(guild.id);
  }
}
