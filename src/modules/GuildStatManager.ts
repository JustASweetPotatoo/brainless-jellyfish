import { Collection, Events, Guild, GuildMember, Message, VoiceState } from "discord.js";
import ClientModule from "./core/ClientModule";
import { On, Repository } from "./core/decorators";
import GuildStatistics, { GuildStatisticsIncrementType } from "../database/model/GuildStatistics";
import GuildStatisticsRepo from "../database/repository/GuildStatisticsRepo";

export default class GuildStatisticsManager extends ClientModule<"guild-statistics-manager"> {
  private readonly cacheCollection: Collection<string, GuildStatistics> = new Collection();
  private readonly UPDATE_PER_TIMES: number = 250;
  private updatedTimes: number = 0;

  private async getCache(guildId: string, timestampByDays?: string) {
    if (!timestampByDays)
      timestampByDays = Math.floor(new Date().getTime() / 1000 / 60 / 24).toString();
    const cachedId = `${guildId}|${timestampByDays}`;
    let cached = this.cacheCollection.get(cachedId);
    if (!cached) {
      cached = await this.statisticsRepository.get({ id: guildId, timestampByDays });
      this.cacheCollection.set(cachedId, cached);
    }

    return cached;
  }

  private updatedTimeIncrement() {
    this.updatedTimes++;

    if (this.updatedTimes == this.UPDATE_PER_TIMES) {
      this.cacheCollection.forEach((item) =>
        this.statisticsRepository.update(item).catch((error) => error),
      );

      this.updatedTimes = 0;
    }
  }

  @Repository()
  private statisticsRepository!: GuildStatisticsRepo;

  @On(Events.MessageCreate)
  protected async onMessageCreate(message: Message): Promise<void> {
    if (!message.guildId) return;
    this.updatedTimeIncrement();
    await this.statisticsRepository.increment(message.guildId, GuildStatisticsIncrementType.MSG);
  }

  @On(Events.GuildMemberAdd)
  protected async onGuildMemberAdd(member: GuildMember): Promise<void> {
    this.updatedTimeIncrement();
    await this.statisticsRepository.increment(member.guild.id, GuildStatisticsIncrementType.JOIN);
  }

  @On(Events.GuildMemberRemove)
  protected async onGuildMemberRemove(member: GuildMember): Promise<void> {
    this.updatedTimeIncrement();
    await this.statisticsRepository.increment(member.guild.id, GuildStatisticsIncrementType.LEAVE);
  }

  @On(Events.VoiceStateUpdate)
  protected async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (!oldState.channelId && newState.channelId) {
      this.updatedTimeIncrement();
      await this.statisticsRepository.increment(
        oldState.guild.id,
        GuildStatisticsIncrementType.LEAVE,
      );
    }
  }

  async getStatistics(guild: Guild): Promise<GuildStatistics> {
    const timestampByDays = Math.floor(new Date().getTime() / 1000 / 60 / 24).toString();

    return this.statisticsRepository.get({ id: guild.id, timestampByDays: timestampByDays });
  }
}
