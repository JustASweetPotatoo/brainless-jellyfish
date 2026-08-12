import {
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  GuildMember,
  InteractionEditReplyOptions,
  Message,
  TextChannel,
} from "discord.js";

import ClientModule from "../core/ClientModule";
import { ModuleOptions } from "../core/BaseModule";

import GuildLevelProviderProfile from "../../database/model/RankProviderGuildProfile";
import UserLevelProfile from "../../database/model/UserLevelProfile";

import GuildLevelProviderProfileRepo from "../../database/repository/LevelProviderGuildConfigRepo";
import UserlevelProfileRepo from "../../database/repository/UserLevelProfileRepo";

import { calcLevel, getRandomInt } from "../../utils/calculator";
import RankProviderMilestone from "../../database/model/RankProviderMilestone";
import { autoDeferReply } from "../../utils/functions";
import { ModuleOn, On, Repository } from "../core/decorators";

export enum MessageLevelProviderEvents {
  GUILD_ACTIVE = "guildActive",
  LOG_CHANNEL_CHANGE = "logChannelChange",
  USER_LEVEL_ADD = "userLevelAdd",
  USER_EXP_ADD = "userExpAdd",
  USER_LEVEL_UP = "userLevelUp",
}

export enum UserLevelType {
  TEXT = 1,
  VOICE = 2,
}

export interface UserLevelAddOptions {
  member: GuildMember;
  type: UserLevelType;
  amount: number;
}

export interface LogChannelChangeEvent {
  guildProfile: GuildLevelProviderProfile;
  oldChannelId: string | null;
  newChannelId: string;
}

export default class MessageLevelProvider extends ClientModule<"message-level-provider"> {
  private readonly channelCache: Collection<string, TextChannel>;
  private readonly guildProfileCache: Collection<string, GuildLevelProviderProfile>;
  private readonly userProfileCache: Collection<string, UserLevelProfile>;

  @Repository()
  readonly guildRepo: GuildLevelProviderProfileRepo;

  @Repository()
  readonly userRepo: UserlevelProfileRepo;

  constructor(options: ModuleOptions) {
    super(options);

    this.channelCache = new Collection();
    this.guildProfileCache = new Collection();
    this.userProfileCache = new Collection();
  }

  public async changeLogChannel(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    await autoDeferReply(interaction, {
      ephemeral: true,
    });

    const channel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
    const guildProfile = await this.getGuildProfile(interaction.guildId);
    const oldChannelId = guildProfile.logChannelId!;
    guildProfile.logChannelId = channel.id;

    this.emit(MessageLevelProviderEvents.LOG_CHANNEL_CHANGE, {
      guildProfile,
      oldChannelId,
      newChannelId: channel.id,
    } satisfies LogChannelChangeEvent);

    const changeChannelEmbed = new EmbedBuilder({
      title: "Thao tác thành công!",
      description: `Kênh thông báo lên cấp đã chuyển từ
      > **Trước:** ${oldChannelId ? `<#${oldChannelId}>` : "Không xác định"}
      > **Sau:** <#${channel.id}>`,
      color: Colors.Green,
      timestamp: Date.now(),
      footer: {
        text: `UID: ${interaction.user.id}`,
      },
    });

    const setChannelEmbed = new EmbedBuilder({
      title: "Thao tác thành công!",
      description: `**Kênh thông báo lên cấp đã được set**\n> <#${channel.id}>`,
      color: Colors.Green,
      footer: {
        text: `UID: ${interaction.user.id}`,
      },
      timestamp: Date.now(),
    });

    const interactionReplyPayload: InteractionEditReplyOptions = {
      embeds: [oldChannelId ? changeChannelEmbed : setChannelEmbed],
    };

    await interaction.editReply(interactionReplyPayload);
  }

  @ModuleOn(MessageLevelProviderEvents.GUILD_ACTIVE)
  private async onGuildActive(guildProfile: GuildLevelProviderProfile) {
    await this.updateGuildProfile(guildProfile);
  }

  @ModuleOn(MessageLevelProviderEvents.LOG_CHANNEL_CHANGE)
  private async onLogChannelChange(event: LogChannelChangeEvent) {
    if (event.oldChannelId) {
      this.channelCache.delete(`${event.oldChannelId}|${event.guildProfile.id}`);
    }

    await this.updateGuildProfile(event.guildProfile);
  }

  @ModuleOn(MessageLevelProviderEvents.USER_LEVEL_ADD)
  private async onUserLevelAdd(options: UserLevelAddOptions) {
    const userProfile = await this.getUserProfile(options.member);

    userProfile.addLevel(options.type === UserLevelType.TEXT, options.amount);

    await this.updateUserProfile(userProfile);
  }

  @ModuleOn(MessageLevelProviderEvents.USER_EXP_ADD)
  private async onUserExpAdd(options: UserLevelAddOptions) {
    const userProfile = await this.getUserProfile(options.member);

    userProfile.addExp(options.type === UserLevelType.TEXT, options.amount);

    await this.updateUserProfile(userProfile);
  }

  private async updateUserProfile(profile: UserLevelProfile) {
    this.userProfileCache.set(profile.getCacheId(), profile);
    await this.userRepo.update(profile).catch((error) => this.handleClientError(error));
  }

  private async updateGuildProfile(profile: GuildLevelProviderProfile) {
    this.guildProfileCache.set(profile.id, profile);
    await this.guildRepo.update(profile).catch((error) => this.handleClientError(error));
  }

  private async getGuildProfile(guildId: string): Promise<GuildLevelProviderProfile> {
    let guildProfile = this.guildProfileCache.get(guildId);

    if (!guildProfile) {
      guildProfile = await this.guildRepo.get(guildId);
    }

    if (!guildProfile) {
      guildProfile = new GuildLevelProviderProfile({
        id: guildId,
      });

      await this.guildRepo.create(guildProfile);
    }
    this.guildProfileCache.set(guildId, guildProfile);

    return guildProfile;
  }

  private async getUserProfile(member: GuildMember) {
    const cacheId = `${member.id}|${member.guild.id}`;

    let userProfile = this.userProfileCache.get(cacheId);

    if (!userProfile) {
      userProfile = await this.userRepo.get({
        id: member.id,
        guildId: member.guild.id,
      });
    }

    if (!userProfile) {
      userProfile = new UserLevelProfile({
        id: member.id,
        guild_id: member.guild.id,
      });
    }

    this.userProfileCache.set(cacheId, userProfile);

    return userProfile;
  }

  private contentToExp(messageContent: string) {
    const contentMaxLength = 100;
    const contentSplitedMaxLenght = 20;

    const contentSplitedLength = messageContent.split(" ").length;

    const contentLenght = messageContent.length;

    const ratio_1 = contentLenght > contentMaxLength ? 1.0 : contentLenght / contentMaxLength;

    const ratio_2 =
      contentSplitedLength > contentSplitedMaxLenght ? 1.0 : contentSplitedLength / contentSplitedMaxLenght;

    const ratio = (ratio_1 + 2 * ratio_2) / 2;

    const final = ratio / 2 < 0.5 ? 0.5 : ratio / 2;

    return Math.ceil(getRandomInt(25, 35) * final);
  }

  private async getLogChannel(member: GuildMember): Promise<TextChannel | undefined> {
    const guildProfile = await this.getGuildProfile(member.guild.id);

    if (!guildProfile.logChannelId) {
      return;
    }

    const channelCacheId = `${guildProfile.logChannelId}|${member.guild.id}`;

    let channel = this.channelCache.get(channelCacheId);

    if (!channel) {
      const fetchedChannel = member.guild.channels.cache.get(guildProfile.logChannelId);

      if (!(fetchedChannel instanceof TextChannel)) {
        this.logger.warn(
          `Channel not found in server ${member.guild.name}/${member.guild.id} with id: ${guildProfile.logChannelId}`,
        );

        return;
      }

      channel = fetchedChannel;

      this.channelCache.set(channelCacheId, channel);
    }

    return channel;
  }

  @ModuleOn(MessageLevelProviderEvents.USER_LEVEL_UP)
  private async onUserLevelUp(member: GuildMember, profile: UserLevelProfile): Promise<UserLevelProfile> {
    const guildProfile = await this.getGuildProfile(member.guild.id);

    const newLevel = calcLevel(profile.messageExp);

    const newMilestone = guildProfile.milestones.find(
      (milestone) => milestone.startAt <= newLevel && newLevel <= milestone.endAt,
    );

    if (newMilestone && newMilestone.id !== profile.milestoneId) {
      const addRole = member.guild.roles.cache.get(newMilestone.roleId ?? "");

      if (!addRole) {
        this.logger.warn(
          `No role found on server ${member.guild.name}/${member.guild.id} with id: ${newMilestone.roleId}`,
        );
      } else {
        await member.roles.add(addRole).catch((error) => this.logger.error(error));
      }

      profile.milestoneId = newMilestone.id;
    }

    void this.sendLevelUpNotification(member, newLevel, newMilestone).catch((error) => this.handleClientError(error));
    await this.updateUserProfile(profile);
    return profile;
  }

  private async sendLevelUpNotification(member: GuildMember, newLevel: number, newMilestone?: RankProviderMilestone) {
    const channel = await this.getLogChannel(member);

    if (!channel) return;

    const embed = new EmbedBuilder({
      title: `Bạn đã đạt level ${newLevel}`,
      description: newMilestone
        ? `\n*Bạn đã đạt được thành tựu:${
            newMilestone.roleId ? ` **<@&${newMilestone.roleId}>**` : " Vai trò không xác định !"
          }*`
        : undefined,
      color: Colors.Blurple,
    });

    await channel.send({
      content: `<@${member.id}> level up !`,
      embeds: [embed],
    });
  }

  @On(Events.MessageCreate)
  protected async onMessageCreate(message: Message<boolean>): Promise<void> {
    const member = message.member;

    if (!member || member.user.bot) {
      return;
    }

    const guildProfile = await this.getGuildProfile(member.guild.id);

    if (!guildProfile.active) {
      return;
    }

    let userProfile = await this.getUserProfile(member);

    const oldLevel = calcLevel(userProfile.messageExp);

    const newMessageExp = userProfile.messageExp + this.contentToExp(message.content);

    const newLevel = calcLevel(newMessageExp);

    userProfile.messageExp = newMessageExp;

    if (oldLevel !== newLevel) {
      this.emit(MessageLevelProviderEvents.USER_LEVEL_UP, member, userProfile);
    }

    await this.userRepo.updateByMessageLevel(userProfile);
  }
}
