import {
  ChatInputCommandInteraction,
  Collection,
  Events,
  GuildMember,
} from "discord.js";
import Module from "./constructor/Module";
import { ModuleOptions } from "./constructor/BaseModule";

import GuildLevelProviderProfile from "../database/model/RankProviderGuildProfile";
import UserLevelProfile from "../database/model/UserLevelProfile";
import GuildLevelProviderProfileRepo from "../database/repository/LUSGuildConfigRepo";
import UserlevelProfileRepo from "../database/repository/UserLevelProfileRepo";
import { calcLevel, getTotalExpToReachLevel } from "../utils/calculator";
import { autoDeferReply } from "../utils/functions";

export interface IncreaseLevelOptions {
  member: GuildMember;
  add: boolean;
  typeText: boolean;
  amount: number;
}

export default class MemberLevelManager extends Module {
  readonly discordEvents: Events[] = [];

  private readonly guildProfileCache: Collection<
    string,
    GuildLevelProviderProfile
  >;
  private readonly userProfileCache: Collection<string, UserLevelProfile>;

  readonly guildRepo: GuildLevelProviderProfileRepo;
  readonly userRepo: UserlevelProfileRepo;

  constructor(options: ModuleOptions) {
    super(`user-level-manager`, options);

    this.guildRepo = new GuildLevelProviderProfileRepo(options.client.database);
    this.userRepo = new UserlevelProfileRepo(options.client.database);
  }

  private async getGuildProfile(
    guildId: string,
  ): Promise<GuildLevelProviderProfile> {
    let guildProfile = this.guildProfileCache.get(guildId);
    if (!guildProfile) guildProfile = (await this.guildRepo.get(guildId))!;
    if (!guildProfile)
      guildProfile = new GuildLevelProviderProfile({ id: guildId });
    return guildProfile;
  }

  private async getUserProfile(member: GuildMember) {
    let userProfile = this.userProfileCache.get(
      `${member.id}|${member.guild.id}`,
    );
    if (!userProfile)
      userProfile = await this.userRepo.get({
        id: member.id,
        guildId: member.guild.id,
      });
    if (!userProfile)
      userProfile = new UserLevelProfile({
        id: member.id,
        guild_id: member.guild.id,
      });
    return userProfile;
  }

  public async updateLevel(
    interaction: ChatInputCommandInteraction,
    member: GuildMember,
    typeText: boolean,
    amount: number,
  ) {
    try {
      await autoDeferReply(interaction, { ephemeral: true });
      const userProfile = await this.getUserProfile(member);

      if (typeText) {
        userProfile.messageExp = getTotalExpToReachLevel(amount);
      } else {
        userProfile.voiceExp = getTotalExpToReachLevel(amount);
      }

      await this.userRepo.updateByMessageLevel(userProfile);
    } catch (error) {
      this.client.errorHandler.responseSlashCommandErrorInteraction(
        interaction,
        error as Error,
      );
    }
  }

  public async increaseLevel(
    interaction: ChatInputCommandInteraction,
    options: IncreaseLevelOptions,
  ) {
    try {
      const userProfile = await this.getUserProfile(options.member);

      if (options.typeText) {
        let newLevel =
          calcLevel(userProfile.messageExp) +
          (options.add ? options.amount : -options.amount);
        userProfile.messageExp = getTotalExpToReachLevel(newLevel);
      } else {
        let newLevel =
          calcLevel(userProfile.voiceExp) +
          (options.add ? options.amount : -options.amount);
        userProfile.voiceExp = getTotalExpToReachLevel(newLevel);
      }

      this.userRepo.updateByMessageLevel(userProfile);
    } catch (error) {
      this.client.errorHandler.responseSlashCommandErrorInteraction(
        interaction,
        error as Error,
      );
    }
  }
}
