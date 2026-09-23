import { Collection } from "discord.js";
import GuildStatus, { PremiumStatus } from "../database/model/GuildStatus";
import GuildStatusRepository from "../database/repository/GuildStatusRepo";
import DiscordModule from "./core/module/DiscordModule";
import { ModuleOn, Repository } from "./core/decorators/decorators";
import { ModuleMap } from "./core/ModuleManager";
import GuildLoggerProfileRepo from "../database/repository/guildLogger/GuildLoggerProfileRepo";
import GuildLoggerProfile from "../database/model/logger/GuildLoggerProfile";

export enum LogChannelType {
  MESSSAGE,
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
  private readonly guildCache: Collection<string, GuildStatus> = new Collection();

  async disableModule<K extends keyof ModuleMap>(guildId: string, mdName: K): Promise<GuildStatus> {
    const res = await this.repo.get(guildId);
    res.activeList = res.activeList.filter((value) => value != mdName);
    await this.repo.update(res);
    return res;
  }

  async enableModule<K extends keyof ModuleMap>(guildId: string, mdName: K): Promise<GuildStatus> {
    const res = await this.repo.get(guildId);
    if (res.activeList.find((mname) => mname == mdName)) {
      return res;
    }
    res.activeList.push(mdName);
    await this.repo.update(res);
    return res;
  }

  async get(guildId: string): Promise<GuildStatus> {
    let $ = await this.repo.get(guildId);
    if (!$) {
      $ = new GuildStatus({ id: guildId });
      await this.repo.update($);
    }

    return $;
  }

  async isActive(guildId: string, moduleName: keyof ModuleMap): Promise<boolean> {
    const activeList = (await this.get(guildId)).activeList;
    const isActive = activeList.find((value) => value == moduleName);

    return !!isActive;
  }

  async getLogProfile(guildId: string) {
    let profile = this.guildLogCache.get(guildId);

    if (!profile) {
      profile = await this.logRepo.get(guildId, true);
      this.guildLogCache.set(guildId, profile);
    }

    return profile;
  }

  async updateLogProfile(profile: GuildLoggerProfile) {
    return await this.logRepo.update(profile);
  }

  async getChannelLogId(guildId: string, logType: LogChannelType): Promise<string | undefined> {
    const profile = await this.getLogProfile(guildId);

    switch (logType) {
      case LogChannelType.USER:
        return profile.userChannelId;
      case LogChannelType.JOIN_LEAVE:
        return profile.userJoinLeaveChannelId;
      case LogChannelType.MESSSAGE:
        return profile.messsageChannelId;
      case LogChannelType.VOICE:
        return profile.voiceChannelId;
      case LogChannelType.GUILD:
        return profile.guildChannelId;
      default:
        return undefined;
    }
  }

  async isActiveLog(guildId: string, logType: LogChannelType): Promise<boolean> {
    const profile = await this.getLogProfile(guildId);

    switch (logType) {
      case LogChannelType.USER:
        return !!profile.userChannelId;
      case LogChannelType.JOIN_LEAVE:
        return !!profile.userJoinLeaveChannelId;
      case LogChannelType.MESSSAGE:
        return !!profile.messsageChannelId;
      case LogChannelType.VOICE:
        return !!profile.voiceChannelId;
      case LogChannelType.GUILD:
        return !!profile.guildChannelId;
      default:
        return false;
    }
  }
}
