import { Collection } from "discord.js";

import GuildStatus, { GuildStatusObj, PremiumStatus } from "../../database/model/GuildStatus";
import GuildStatusRepository from "../../database/repository/GuildStatusRepo";
import DiscordModule from "./module/DiscordModule";
import { Repository } from "./decorators/decorators";
import { ModuleMap } from "./ModuleManager";
import { getHashValueObject, setHashValueObject } from "../../utils/redis";
import ClientError from "../../error/ClientError";
import { ErrorCode } from "../../error/ErrorCode";

export enum LogChannelType {
  MESSAGE,
  VOICE,
  JOIN_LEAVE,
  USER,
  GUILD,
}

export default class GuildStatusManager extends DiscordModule<"guild-status-manager"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;
  readonly webManaged: boolean = true;

  private readonly profileCache: Collection<string, GuildStatus> = new Collection();

  @Repository()
  private readonly repo: GuildStatusRepository;

  private async getRedisCache(guildId: string): Promise<GuildStatus | undefined> {
    const redisCache = await getHashValueObject(this.redis, `status:guild:${guildId}`);

    if (redisCache) return GuildStatus.fromJSON(redisCache as GuildStatusObj);
  }

  private async setRedisCache(status: GuildStatus) {
    return await setHashValueObject(
      this.redis,
      `status:guild:${status.id}`,
      status.toJSON(),
      0,
      60 * 60,
    );
  }

  async getUnnomalizedStatus(guildId: string): Promise<GuildStatus | "no-guild"> {
    const guild = this.client.guilds.cache.get(guildId);

    if (guild) {
      return await this.getStatus(guildId);
    }

    return "no-guild";
  }

  async getGuildUnnomalizedModuleState(guildId: string, mdName: keyof ModuleMap) {
    const guildStatus = await this.getUnnomalizedStatus(guildId);
    if (guildStatus == "no-guild") {
      return guildStatus;
    }

    return await this.isActive(guildId, mdName);
  }

  async getGuildManagedModuleStateMap(guildId: string) {
    const state = await this.getUnnomalizedStatus(guildId);

    if (state == "no-guild") {
      return state;
    }

    return state.activeList;
  }

  async getStatus(guildId: string): Promise<GuildStatus> {
    let cached = this.profileCache.get(guildId);
    if (cached) return cached;

    let redisCache = await this.getRedisCache(guildId);
    if (redisCache) {
      cached = redisCache;
      this.profileCache.set(guildId, cached);
      return redisCache;
    }

    cached = await this.repo.get(guildId);
    if (!cached) {
      cached = await this.repo.create(new GuildStatus({ id: guildId }));
    }

    this.profileCache.set(guildId, cached);
    await this.setRedisCache(cached);
    return cached;
  }

  async setStatus(status: GuildStatus) {
    this.profileCache.set(status.id, status);
    await this.setRedisCache(status);
    await this.repo.update(status);
    return status;
  }

  async isActive(
    guildId: string,
    moduleName: keyof ModuleMap,
    normalized: boolean = true,
  ): Promise<boolean> {
    const status = normalized
      ? await this.getStatus(guildId)
      : await this.getUnnomalizedStatus(guildId);
    if (status == "no-guild") return false;

    const isActive = status.activeList.find((value) => value == moduleName);
    return !!isActive;
  }
}
