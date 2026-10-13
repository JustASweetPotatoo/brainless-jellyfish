import { Collection } from "discord.js";
import GuildStatus, { GuildStatusObj, PremiumStatus } from "../database/model/GuildStatus";
import GuildStatusRepository from "../database/repository/GuildStatusRepo";
import DiscordModule from "./core/module/DiscordModule";
import { ModuleOn, Repository } from "./core/decorators/decorators";
import { ModuleMap } from "./core/ModuleManager";
import GuildLoggerProfileRepo from "../database/repository/guildLogger/GuildLoggerProfileRepo";
import GuildLoggerProfile, {
  GuildLoggerProfileJson,
} from "../database/model/logger/GuildLoggerProfile";
import { getHashValueObject, setHashValueObject } from "../utils/redis";

export enum LogChannelType {
  MESSAGE,
  VOICE,
  JOIN_LEAVE,
  USER,
  GUILD,
}

export default class GuildStatusManager extends DiscordModule<"guild-status-manager"> {
  protected readonly premiumLevel: PremiumStatus = PremiumStatus.STANDARD;

  @Repository()
  private readonly repo: GuildStatusRepository;

  @Repository()
  private readonly logRepo: GuildLoggerProfileRepo;

  private readonly guildLogCache: Collection<string, GuildLoggerProfile> = new Collection();

  async disableModule<K extends keyof ModuleMap>(guildId: string, mdName: K): Promise<GuildStatus> {
    const res = await this.repo.get(guildId);
    res.activeList = res.activeList.filter((value) => value != mdName);
    await this.repo.update(res);
    return res;
  }

  async enableModule<K extends keyof ModuleMap>(guildId: string, mdName: K): Promise<boolean> {
    if (await this.isActive(guildId, mdName)) {
      const res = await this.getStatus(guildId);
      res.activeList.push(mdName);
      await this.setStatus(res);
      return true;
    }

    return false;
  }

  private async getRedisCache(guildId: string): Promise<GuildStatus | undefined> {
    const value = await getHashValueObject(this.redisClient, `status:guild:${guildId}`);

    if (value) {
      return GuildStatus.fromJSON(value as GuildStatusObj);
    }
  }

  private async getRedisLogCache(guildId: string): Promise<GuildLoggerProfile | undefined> {
    const value = await getHashValueObject(this.redisClient, `status:logs:guild:${guildId}`);

    if (value) {
      return GuildLoggerProfile.fromJSON(value as GuildLoggerProfileJson);
    }
  }

  private async setRedisCache(status: GuildStatus) {
    return await setHashValueObject(
      this.redisClient,
      `status:guild:${status.id}`,
      status.toJSON(),
      1,
    );
  }

  private async setRedisLogCache(profile: GuildLoggerProfile) {
    return await setHashValueObject(
      this.redisClient,
      `status:logs:guild:${profile.guildId}`,
      profile.toJSON(),
      1,
    );
  }

  async getStatus(guildId: string): Promise<GuildStatus> {
    const redisData = await this.getRedisCache(guildId);

    if (redisData) {
      return redisData;
    }

    let status = await this.repo.get(guildId);

    if (!status) {
      status = new GuildStatus({ id: guildId });
      await this.repo.update(status);
    }

    await this.setRedisCache(status);
    return status;
  }

  async setStatus(status: GuildStatus) {
    await this.setRedisCache(status);
    await this.repo.update(status);
  }

  async isActive(guildId: string, moduleName: keyof ModuleMap): Promise<boolean> {
    const status = await this.getStatus(guildId);
    const isActive = status.activeList.find((value) => value == moduleName);
    return !!isActive;
  }

  async getLogStatus(guildId: string) {
    const redisData = await this.getRedisLogCache(guildId);
    if (redisData) {
      return redisData;
    }

    let status = this.guildLogCache.get(guildId);

    if (!status) {
      status = await this.logRepo.get(guildId, true);
      this.guildLogCache.set(guildId, status);
    }

    await this.setRedisLogCache(status);
    return status;
  }

  async setLogStatus(status: GuildLoggerProfile) {
    await this.logRepo.update(status);
    await this.setRedisLogCache(status);
  }

  async getChannelLogId(guildId: string, logType: LogChannelType): Promise<string | undefined> {
    const profile = await this.getLogStatus(guildId);

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
}
