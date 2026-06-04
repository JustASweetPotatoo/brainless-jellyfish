import {
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  GuildMember,
  Message,
  Role,
  TextChannel,
} from "discord.js";
import Module from "./constructor/Module";
import { ModuleOptions } from "./constructor/BaseModule";

import GuildLevelProviderProfile from "../database/model/RankProviderGuildProfile";
import UserLevelProfile from "../database/model/UserLevelProfile";

import GuildLevelProviderProfileRepo from "../database/repository/LUSGuildConfigRepo";
import UserlevelProfileRepo from "../database/repository/UserLevelProfileRepo";
import { calcLevel, getRandomInt } from "../utils/calculator";
import RankProviderMilestone from "../database/model/RankProviderMilestone";

export default class MessageRankProvider extends Module {
  readonly discordEvents: Events[] = [Events.MessageCreate];

  private readonly channelCache: Collection<string, TextChannel> =
    new Collection();
  private readonly guildProfileCache: Collection<
    string,
    GuildLevelProviderProfile
  >;
  private readonly userProfileCache: Collection<string, UserLevelProfile>;

  readonly guildRepo: GuildLevelProviderProfileRepo;
  readonly userRepo: UserlevelProfileRepo;

  constructor(options: ModuleOptions) {
    super("message-rank-provider", options);

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

  private calcExp(messageContent: string) {
    const contentMaxLength = 100;
    const contentSplitedMaxLenght = 20;

    const contentSplitedLength = messageContent.split(" ").length; // 1
    const contentLenght = messageContent.length; // 1

    const ratio_1 =
      contentLenght > contentMaxLength ? 1.0 : contentLenght / contentMaxLength;
    const ratio_2 =
      contentSplitedLength > contentSplitedMaxLenght
        ? 1.0
        : contentSplitedLength / contentSplitedMaxLenght;

    const ratio = (ratio_1 + 2 * ratio_2) / 2;
    const final = ratio / 2 < 0.5 ? 0.5 : ratio / 2;

    return Math.ceil(getRandomInt(25, 35) * final);
  }

  private async getLogChannel(
    member: GuildMember,
  ): Promise<TextChannel | undefined> {
    const guildProfile = await this.getGuildProfile(member.guild.id);

    if (!guildProfile.logChannelId) return;

    const channelCacheId = `${guildProfile.logChannelId}|${member.guild.id}`;
    let channel = this.channelCache.get(channelCacheId);
    if (!channel) {
      const fetchedChannel = member.guild.channels.cache.get(
        guildProfile.logChannelId,
      );

      if (!(fetchedChannel instanceof TextChannel)) {
        this.logger.warn(
          `Channel not found in server ${member.guild.name}/${member.guild.id} with id: ${guildProfile.logChannelId}`,
        );
        return;
      }

      channel = fetchedChannel;
    }

    return channel;
  }

  private async onUserLevelUp(
    member: GuildMember,
    profile: UserLevelProfile,
  ): Promise<any> {
    const guildProfile = await this.getGuildProfile(member.guild.id);

    const newLevel = calcLevel(profile.messageExp);
    let milestoneChanged: boolean = false;
    let addRole: Role | undefined;

    const newMilestone = guildProfile.milestones.find(
      (milestone) =>
        milestone.startAt <= newLevel && newLevel <= milestone.endAt,
    );

    if (newMilestone && newMilestone.id != profile.milestoneId) {
      milestoneChanged = true;
      addRole = member.guild.roles.cache.get(newMilestone?.roleId ?? "");

      if (!addRole) {
        this.logger.warn(
          `No role found on server ${member.guild.name}/${member.guild.id} with id: ${newMilestone.roleId}`,
        );
      } else {
        member.roles.add(addRole).catch((e) => this.logger.error(e));
      }

      this.sendLevelUpNotification(member, newLevel, newMilestone).catch(
        (error) => this.logger.error(error),
      );
    }
  }

  private async sendLevelUpNotification(
    member: GuildMember,
    newLevel: number,
    newMilestone: RankProviderMilestone,
  ) {
    const channel = await this.getLogChannel(member);

    if (channel) {
      const embed = new EmbedBuilder({
        title: `Bạn đã đạt level ${newLevel}`,
        description: `${
          newMilestone
            ? `\n*Bạn đã đạt được thành tựu:${
                newMilestone.roleId
                  ? `**<@&${newMilestone.roleId}**`
                  : "Vai trò không xác định !"
              }*`
            : undefined
        }`,
        color: Colors.Blurple,
      });

      await channel.send({ embeds: [embed] });
    }
  }

  protected async onMessageCreate(message: Message<boolean>): Promise<any> {
    try {
      const member = message.member;
      if (!member || member.user.bot) return;

      let userProfile = await this.getUserProfile(member);

      const oldLevel = calcLevel(userProfile.messageExp);
      const newMessageExp =
        userProfile.messageExp + this.calcExp(message.content);
      const newLevel = calcLevel(newMessageExp);
      userProfile.messageExp = newMessageExp;

      if (oldLevel != newLevel) {
        userProfile = await this.onUserLevelUp(member, userProfile);
      }

      await this.userRepo.updateByMessageLevel(userProfile);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
