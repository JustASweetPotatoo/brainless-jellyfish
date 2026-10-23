import { Collection, TextChannel } from "discord.js";

import { PremiumStatus } from "../database/model/GuildStatus";
import GuildLoggerProfileRepo from "../database/repository/guildLogger/GuildLoggerProfileRepo";
import DiscordModule from "./core/module/DiscordModule";
import GuildLogProfile, {
  GuildLoggerProfileJson as GuildLogProfileJson,
} from "../database/model/logger/GuildLoggerProfile";
import { Repository } from "./core/decorators/decorators";
import { LogChannelType } from "./core/GuildStatusManager";
import { getHashValueObject, setHashValueObject } from "../utils/redis";

export default class GuildLogManager extends DiscordModule<"guild-log-manager"> {
  readonly webManaged: boolean = true;
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;
  private readonly guildLogCache: Collection<string, GuildLogProfile> = new Collection();

  @Repository()
  private readonly repo: GuildLoggerProfileRepo;

  async getStatus(guildId: string) {
    const redisCache = await this.redisGetGuild(guildId);
    if (redisCache) {
      this.guildLogCache.set(guildId, redisCache);
      return redisCache;
    }

    let cache = this.guildLogCache.get(guildId);
    if (cache) return cache;

    cache = await this.repo.get(guildId, true);
    this.guildLogCache.set(guildId, cache);
    await this.redisSetGuild(cache);
    return cache;
  }

  async setStatus(status: GuildLogProfile) {
    this.guildLogCache.set(status.guildId, status);
    await this.repo.update(status);
    await this.redisSetGuild(status);
  }

  async getChannel(guildId: string, logType: LogChannelType) {
    const channelId = await this.getChannelId(guildId, logType);
    if (!channelId) return undefined;

    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return undefined;

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !(channel instanceof TextChannel)) return;

    return channel;
  }

  async getChannelId(guildId: string, logType: LogChannelType): Promise<string | undefined> {
    const profile = await this.getStatus(guildId);

    switch (logType) {
      case LogChannelType.USER:
        return profile.userChannelId;
      case LogChannelType.JOIN_LEAVE:
        return profile.userJoinLeaveChannelId;
      case LogChannelType.MESSAGE:
        return profile.messsageChannelId;
      case LogChannelType.VOICE:
        return profile.voiceChannelId;
      case LogChannelType.GUILD:
        return profile.guildChannelId;
      default:
        return undefined;
    }
  }

  private async redisGetGuild(guildId: string): Promise<GuildLogProfile | undefined> {
    const value = await getHashValueObject(this.redis, `status:logs:guild:${guildId}`);

    if (value) {
      return GuildLogProfile.fromJSON(value as GuildLogProfileJson);
    }
  }

  private async redisSetGuild(p: GuildLogProfile) {
    return await setHashValueObject(this.redis, `status:logs:guild:${p.guildId}`, p.toJSON());
  }
}
