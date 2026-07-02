import {
  ChatInputCommandInteraction,
  Collection,
  Events,
  GuildMember,
} from "discord.js";
import ClientModule from "../core/ClientModule";
import { ModuleOptions } from "../core/Module";

import GuildLevelProviderProfile from "../../database/model/RankProviderGuildProfile";
import UserLevelProfile from "../../database/model/UserLevelProfile";
import GuildLevelProviderProfileRepo from "../../database/repository/LevelProviderGuildConfigRepo";
import UserlevelProfileRepo from "../../database/repository/UserLevelProfileRepo";
import { Inject } from "../core/decorators";

export interface IncreaseLevelOptions {
  member: GuildMember;
  add: boolean;
  typeText: boolean;
  amount: number;
}

export enum LevelType {
  TEXT,
  VOICE,
}

export default class GuildMemberLevelManager extends ClientModule {
  readonly discordEvents: Events[] = [];

  private readonly guildProfileCache: Collection<
    string,
    GuildLevelProviderProfile
  >;
  private readonly userProfileCache: Collection<string, UserLevelProfile>;

  @Inject()
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

  async activeGuild(
    interaction: ChatInputCommandInteraction<"cached">,
    isEmphemeral?: boolean,
  ) {}
}
