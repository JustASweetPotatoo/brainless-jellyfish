import path from "path";

import {
  APIRole,
  AttachmentBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  ContainerBuilder,
  EmbedBuilder,
  Events,
  GuildMember,
  Message,
  Role,
  SeparatorBuilder,
  TextChannel,
  TextDisplayBuilder,
  VoiceState,
} from "discord.js";

import ClientModule from "./core/ClientModule";
import GuildLevelProviderProfile from "../database/model/RankProviderGuildProfile";
import UserLevelProfile from "../database/model/UserLevelProfile";
import { ModuleOn, On, Repository, SlashCommandExecutor } from "./core/decorators";
import LevelProviderGuildProfileRepo from "../database/repository/LevelProviderGuildProfileRepo";
import UserlevelProfileRepo from "../database/repository/UserLevelProfileRepo";
import RankProviderMilestone from "../database/model/RankProviderMilestone";
import {
  calcLevel,
  calcPercentageOfProgress,
  craftEmbedProgressBar,
  getRandomInt,
  getTotalExpToReachLevel,
} from "../utils/calculator";
import { sendInteractionMessageReply } from "../utils/replier";
import { generateRankCard } from "../utils/test";

const avatarPath = path.join(__dirname, "../assets/avatar.png");

export interface MemberVoiceSession {
  readonly id: string;
  readonly guildId: string;
  readonly joinTimestamp: number;
  isOpenMic: boolean;
  lastOpenMicTimestamp?: number;
  bonusEpx: number;
}

export enum MemberVoiceStateEvents {
  MUTE = "voiceMute",
  UNMUTE = "voiceUnmute",
  JOIN = "voiceJoin",
  LEAVE = "voiceLeave",
}

export enum MessageLevelEvents {
  GUILD_ACTIVE = "guildActive",
  LOG_CHANNEL_CHANGE = "logChannelChange",
  USER_LEVEL_ADD = "userLevelAdd",
  USER_EXP_ADD = "userExpAdd",
  USER_LEVEL_UP = "userLevelUp",
  GUILD_PROFILE_UPDATE = "guildProfileUpdate",
}

export enum VoiceLevelEvents {
  GUILD_ACTIVE = "guildActive",
  LOG_CHANNEL_CHANGE = "logChannelChange",
  USER_LEVEL_ADD = "userLevelAdd",
  USER_EXP_ADD = "userExpAdd",
  USER_LEVEL_UP = "userLevelUp",
  GUILD_PROFILE_UPDATE = "guildProfileUpdate",
}

export default class LevelProvider extends ClientModule<"level-provider"> {
  private readonly guildProfileCache: Collection<string, GuildLevelProviderProfile> =
    new Collection();
  private readonly memberProfileCache: Collection<string, UserLevelProfile> = new Collection();
  private readonly voiceSessions: Collection<string, MemberVoiceSession> = new Collection();

  @Repository()
  readonly guildRepo: LevelProviderGuildProfileRepo;

  @Repository()
  readonly memberRepo: UserlevelProfileRepo;

  private async updateMemberProfile(p: UserLevelProfile) {
    await this.memberRepo.update(p);
    this.memberProfileCache.set(p.getCacheId(), p);
  }

  private async updateGuildProfile(p: GuildLevelProviderProfile) {
    await this.guildRepo.update(p);
    this.guildProfileCache.set(p.id, p);
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

  private async getMemberProfile(member: GuildMember) {
    const cacheId = `${member.id}|${member.guild.id}`;

    let userProfile = this.memberProfileCache.get(cacheId);

    if (!userProfile) {
      userProfile = await this.memberRepo.get({
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

    this.memberProfileCache.set(cacheId, userProfile);

    return userProfile;
  }

  private contentToExp(messageContent: string) {
    const contentMaxLength = 100;
    const contentSplitedMaxLenght = 20;

    const contentSplitedLength = messageContent.split(" ").length;

    const contentLenght = messageContent.length;

    const ratio_1 = contentLenght > contentMaxLength ? 1.0 : contentLenght / contentMaxLength;

    const ratio_2 =
      contentSplitedLength > contentSplitedMaxLenght
        ? 1.0
        : contentSplitedLength / contentSplitedMaxLenght;

    const ratio = (ratio_1 + 2 * ratio_2) / 2;

    const final = ratio / 2 < 0.5 ? 0.5 : ratio / 2;

    return Math.ceil(getRandomInt(25, 35) * final);
  }

  private async getLogChannel(member: GuildMember): Promise<TextChannel | undefined> {
    const guildProfile = await this.getGuildProfile(member.guild.id);

    let channel = await member.guild.channels
      .fetch(guildProfile.logChannelId ?? "")
      .catch((error) => this.logger.error(error));
    return channel instanceof TextChannel ? (channel as TextChannel) : undefined;
  }

  private async sendLevelUpMessage(
    member: GuildMember,
    newLevel: number,
    newMilestone?: RankProviderMilestone,
  ) {
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

  private classifyVoiceState(oldState: VoiceState, newState: VoiceState): MemberVoiceStateEvents {
    if (oldState.channelId && !newState.channelId) {
      return MemberVoiceStateEvents.LEAVE;
    } else if (!oldState.channelId && newState.channelId) {
      return MemberVoiceStateEvents.JOIN;
    } else if (!oldState.mute && newState.mute) {
      return MemberVoiceStateEvents.MUTE;
    } else {
      return MemberVoiceStateEvents.UNMUTE;
    }
  }

  private async replyWithEmbed(
    interaction: ChatInputCommandInteraction,
    title: string,
    description: string,
    color: number = Colors.Green,
  ) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp()
      .setFooter({
        text: `UID:${interaction.user.id}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  }

  // Voice events
  @ModuleOn(MemberVoiceStateEvents.JOIN)
  private async userJoinVoiceEvent(member: GuildMember) {
    const cacheId = `${member.id}|${member.guild.id}`;
    let session = this.voiceSessions.get(cacheId);
    if (session) return;

    session = {
      id: member.id,
      guildId: member.guild.id,
      joinTimestamp: Date.now(),
      isOpenMic: member.voice?.selfMute ?? true,
      bonusEpx: 0,
      lastOpenMicTimestamp: member.voice?.mute ? undefined : Date.now(),
    };

    this.voiceSessions.set(cacheId, session);
  }

  @ModuleOn(MemberVoiceStateEvents.LEAVE)
  private async userLeaveVoiceEvent(member: GuildMember) {
    const userProfile = await this.getMemberProfile(member);
    const cacheId = `${member.id}|${member.guild.id}`;
    let session = this.voiceSessions.get(cacheId);
    if (!session) {
      return;
    }

    let expBonus = 0;

    if (session.isOpenMic) {
      expBonus +=
        Math.floor(((Date.now() - (session.lastOpenMicTimestamp ?? Date.now())) / 60000) * 0.5) *
        getRandomInt(25, 35);
    }

    const expByMinutes =
      Math.floor(((Date.now() - session.joinTimestamp) / 60000) * 0.5) * getRandomInt(25, 35);

    userProfile.voiceExp += expByMinutes + session.bonusEpx + expBonus;

    this.voiceSessions.delete(cacheId);

    await this.memberRepo.updateByVoiceLevel(userProfile);
  }

  @ModuleOn(MemberVoiceStateEvents.MUTE)
  private async userMuteEvent(member: GuildMember) {
    const voiceState = member.voice;
    if (!voiceState) return;
    const cacheId = `${member.id}|${member.guild.id}`;
    let session = this.voiceSessions.get(cacheId);

    if (!session) {
      session = {
        id: member.id,
        guildId: member.guild.id,
        joinTimestamp: Date.now(),
        isOpenMic: voiceState.mute ?? false,
        bonusEpx: 0,
        lastOpenMicTimestamp: voiceState.mute ? undefined : Date.now(),
      };
    }

    if (session.isOpenMic) {
      session.isOpenMic = false;
    }

    const timeByMiliseconds = Date.now() - (session.lastOpenMicTimestamp ?? Date.now());

    const expBonus =
      Math.floor(((timeByMiliseconds > 0 ? timeByMiliseconds : 0) / 60000) * 0.5) *
      getRandomInt(25, 35);

    session.bonusEpx += expBonus;
    this.voiceSessions.set(session.id, session);
  }

  @ModuleOn(MemberVoiceStateEvents.UNMUTE)
  private async userUnmuteEvent(member: GuildMember) {
    if (!member.voice) {
      return;
    }

    const cacheId = `${member.id}|${member.guild.id}`;
    let session = this.voiceSessions.get(cacheId);
    if (!session) {
      session = {
        id: member.id,
        guildId: member.guild.id,
        joinTimestamp: Date.now(),
        isOpenMic: member.voice.mute ?? true,
        bonusEpx: 0,
        lastOpenMicTimestamp: member.voice.mute ? undefined : Date.now(),
      };
    }

    session.lastOpenMicTimestamp = Date.now();

    this.voiceSessions.set(session.id, session);
  }

  // Message events
  @ModuleOn(MessageLevelEvents.USER_LEVEL_UP)
  private async onUserLevelUp(
    member: GuildMember,
    profile: UserLevelProfile,
  ): Promise<UserLevelProfile> {
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

    void this.sendLevelUpMessage(member, newLevel, newMilestone).catch((error) =>
      this.handleModuleError(error),
    );
    await this.updateMemberProfile(profile);
    return profile;
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

    let memberProfile = await this.getMemberProfile(member);
    const oldLevel = calcLevel(memberProfile.messageExp);
    const newMessageExp = memberProfile.messageExp + this.contentToExp(message.content);
    const newLevel = calcLevel(newMessageExp);

    memberProfile.messageExp = newMessageExp;

    if (oldLevel !== newLevel) {
      await this.onUserLevelUp(member, memberProfile);
    }

    await this.memberRepo.updateByMessageLevel(memberProfile);
  }

  @On(Events.VoiceStateUpdate)
  protected async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<any> {
    const member = oldState.member || newState.member;
    if (!member || member.user.bot) return;
    const guildProfile = await this.getGuildProfile(member.guild.id);
    if (!guildProfile.active) return;

    const memberEvent = this.classifyVoiceState(oldState, newState);

    this.emit(memberEvent, oldState, newState);
  }

  /**
   * ===========================================================
   * MANAGEMENT COMMANDS
   * ===========================================================
   */
  @SlashCommandExecutor({ guildOnly: true, defered: true })
  async updateMemberLevel(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString("type", true)?.toLowerCase();
    const amount = interaction.options.getNumber("amount", true);
    const isVoice = interaction.options.getBoolean("is-voice-level") ?? false;
    const targetUser = interaction.options.getUser("user");

    const member = interaction.member;
    if (!member || !("id" in member) || !("guild" in member)) {
      return;
    }

    const targetMember = targetUser
      ? await member.guild.members.fetch(targetUser.id).catch(() => null)
      : null;
    const target = targetMember ?? member;

    if (typeof amount !== "number" || Number.isNaN(amount)) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: "Operation failed",
            description: "Amount must be a valid number !",
            color: Colors.Yellow,
            footer: {
              text: `UID:${interaction.user.id}`,
              iconURL: interaction.user.displayAvatarURL(),
            },
          }).setTimestamp(),
        ],
      });
      return;
    }

    if (type !== "level" && type !== "exp") {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: "Operation failed",
            description: "Type must be either 'level' or 'exp' !",
            color: Colors.Yellow,
            footer: {
              text: `UID:${interaction.user.id}`,
              iconURL: interaction.user.displayAvatarURL(),
            },
          }).setTimestamp(),
        ],
      });
      return;
    }

    const userProfile = await this.getMemberProfile(target as GuildMember);
    const isMessageType = !isVoice;
    const previousLevel = calcLevel(isVoice ? userProfile.voiceExp : userProfile.messageExp);

    if (type === "exp") {
      userProfile.messageExp = amount;
    } else {
      userProfile.messageExp = getTotalExpToReachLevel(amount);
    }

    const newLevel = calcLevel(isVoice ? userProfile.voiceExp : userProfile.messageExp);
    this.memberProfileCache.set(userProfile.getCacheId(), userProfile);

    if (isVoice) {
      await this.memberRepo.updateByVoiceLevel(userProfile);
    } else {
      await this.memberRepo.updateByMessageLevel(userProfile);
    }

    if (previousLevel !== newLevel) {
      await this.onUserLevelUp(target, userProfile);
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          title: "Operation complete !",
          description: `Updated ${isVoice ? "voice" : "message"} ${type === "exp" ? "exp" : "level"} for <@${target.id}>`,
          color: Colors.Green,
          footer: {
            text: `UID:${interaction.user.id}`,
            iconURL: interaction.user.displayAvatarURL(),
          },
        }).setTimestamp(),
      ],
    });
  }

  @SlashCommandExecutor({ guildOnly: true })
  async activeGuild(interaction: ChatInputCommandInteraction<"cached">) {
    const guildProfile = await this.getGuildProfile(interaction.guildId);

    guildProfile.active = !guildProfile.active;
    await this.updateGuildProfile(guildProfile);

    const embed = new EmbedBuilder()
      .setTitle("Opearation complete !")
      .setDescription(guildProfile.active ? "Đã bật hệ thống level !" : "Đã tắt hệ thông level")
      .setColor(Colors.Green)
      .setTimestamp()
      .setFooter({ text: `UID: ${interaction.user.id}` });

    await interaction.editReply({ embeds: [embed] });
  }

  @SlashCommandExecutor({ deferred: true })
  async setChannel(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const guildProfile = await this.getGuildProfile(guildId);

    if (!guildProfile) {
      return;
    }

    const newChannel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);

    if (newChannel.id == guildProfile.logChannelId) {
      const embed = new EmbedBuilder()
        .setTitle("Action incomplete !")
        .setDescription(`Kênh mới không được trùng lặp với kênh thông báo cũ !`)
        .setColor(Colors.Yellow);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const oldChannelId = guildProfile.logChannelId;

    guildProfile.logChannelId = newChannel.id;
    await this.updateGuildProfile(guildProfile);

    const embed = new EmbedBuilder()
      .setTitle("Action complete !")
      .setDescription(
        oldChannelId
          ? `Kênh thông báo lên cấp đã cập nhật\n> **Trước:** <#${oldChannelId}>\n> **Sau:** <#${newChannel.id}>`
          : `Đã đặt kênh thông báo lên cấp là <#${newChannel.id}>`,
      )
      .setColor(Colors.Green)
      .setTimestamp()
      .setFooter({ text: `UID: ${interaction.user.id}` });

    await interaction.editReply({ embeds: [embed] });
  }

  @SlashCommandExecutor({ guildOnly: true })
  private async addBlacklistEntry(
    interaction: ChatInputCommandInteraction,
    profile: GuildLevelProviderProfile,
    targetId: string,
    type: "role" | "channel",
    label: string,
  ) {
    if (profile.blacklist.has(targetId)) {
      await this.replyWithEmbed(
        interaction,
        "Operation failed",
        `${type === "role" ? "Role" : "Channel"} ${label} is already in blacklist !`,
        Colors.Yellow,
      );
      return false;
    }

    profile.blacklist.set(targetId, { id: targetId, type });
    await this.updateGuildProfile(profile);

    await this.replyWithEmbed(
      interaction,
      "Operation complete !",
      `${type === "role" ? "Role" : "Channel"} ${label} has been added to blacklist !`,
      Colors.Green,
    );
    return true;
  }

  @SlashCommandExecutor()
  async listingMilestone(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const prof = await this.getGuildProfile(guild.id);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          title: `Listing for "${guild.name}"`,
          description: `${prof.milestones.map((item) => `<@&${item.roleId}> level: \`${item.startAt}-${item.endAt}\``).join("\n")}`,
          color: Colors.Blurple,
          footer: {
            text: `UID:${interaction.user.id}`,
            iconURL: interaction.user.displayAvatarURL(),
          },
        }).setTimestamp(),
      ],
    });
  }

  @SlashCommandExecutor()
  async addBlacklistRole(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const prof = await this.getGuildProfile(guildId);

    const role = interaction.options.getRole("role");
    const channel = interaction.options.getChannel("channel");

    if (role) {
      await this.addBlacklistEntry(interaction, prof, role.id, "role", `<@&${role.id}>`);
      return;
    }

    if (channel) {
      await this.addBlacklistEntry(interaction, prof, channel.id, "channel", `<#${channel.id}>`);
    }
  }

  @SlashCommandExecutor()
  async createMilestone(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) return;

    const name: string | undefined = interaction.options.getString("name")!;
    const role: APIRole | Role = interaction.options.getRole("role", true);
    const lowLevel: number = interaction.options.getNumber("low", true);
    const highLevel: number = interaction.options.getNumber("high", true);

    if (lowLevel < 0 || highLevel < 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: "Operation failed",
            description: `${lowLevel < 0 ? "Lowest" : "Highest"} level must be greater than 0 !`,
            color: Colors.Yellow,
            footer: {
              text: `UID:${interaction.user.id}`,
              iconURL: interaction.user.displayAvatarURL(),
            },
          }).setTimestamp(),
        ],
      });
      return;
    }

    if (lowLevel >= highLevel) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: "Operation failed",
            description: `Lowest level must be smaller than highest level !`,
            color: Colors.Yellow,
            footer: {
              text: `UID:${interaction.user.id}`,
              iconURL: interaction.user.displayAvatarURL(),
            },
          }).setTimestamp(),
        ],
      });
      return;
    }

    const botMember = await guild.members.fetch(this.client.botId);

    if ((role as Role).comparePositionTo(botMember.roles.highest) >= 0) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: "Operation failed",
            description: `You can't add role higher than highest bot role`,
            color: Colors.Yellow,
            footer: {
              text: `UID:${interaction.user.id}`,
              iconURL: interaction.user.displayAvatarURL(),
            },
          }).setTimestamp(),
        ],
      });
      return;
    }

    const guildProf = await this.getGuildProfile(guild.id);

    for (const [, milestone] of guildProf.milestones) {
      if (
        milestone.startAt == lowLevel &&
        milestone.endAt == highLevel &&
        milestone.roleId == role.id
      ) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder({
              title: "Operation failed",
              description: `Duplicate entries !`,
              color: Colors.Yellow,
              footer: {
                text: `UID:${interaction.user.id}`,
                iconURL: interaction.user.displayAvatarURL(),
              },
            }).setTimestamp(),
          ],
        });
        return;
      }

      if (Math.max(lowLevel, highLevel) <= Math.min(milestone.startAt, milestone.endAt)) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder({
              title: "Operation failed",
              description: `Milestone level can not overlap`,
              color: Colors.Yellow,
              footer: {
                text: `UID:${interaction.user.id}`,
                iconURL: interaction.user.displayAvatarURL(),
              },
            }).setTimestamp(),
          ],
        });
        return;
      }
    }

    const newMilestone = new RankProviderMilestone({
      id: new Date().getTime().toString(),
      role_id: role.id,
      start_at: lowLevel,
      end_at: highLevel,
      guild_id: guild.id,
    });

    guildProf.milestones.set(newMilestone.id, newMilestone);

    await this.updateGuildProfile(guildProf);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          title: "Operation Complete !",
          description: `New milestone added\n> <@&${role.id}> level ${newMilestone.startAt}-${newMilestone.endAt}`,
          footer: { text: `UID:${interaction.user.id}` },
          color: Colors.Green,
        }).setTimestamp(),
      ],
    });
  }

  @SlashCommandExecutor({ guildOnly: true, defered: true, ephemeral: true })
  async getTopMember(interaction: ChatInputCommandInteraction<"cached">) {
    const guildProf = await this.getGuildProfile(interaction.guild.id);
    if (!guildProf.active) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            footer: { text: `UID: ${interaction.member.id}` },
            title: "Operation failed!",
            color: Colors.Yellow,
            description: `Your server is not active yet, please use command \`/level active\` to turn on.`,
          }).setTimestamp(),
        ],
      });
      return;
    }

    const isVoice = interaction.options.getBoolean("is-voice") ?? false;

    const topList = await this.memberRepo.getOrderByLevelInGuild(guildProf.id, 2);

    const convertedUserMessages: string[] = [];
    const convertedUserMessages2: string[] = [];
    const convertedUserMessages3: string[] = [];
    const combined: string[] = [];

    topList.forEach((userData, index) => {
      convertedUserMessages.push(`> **#${index + 1}${index < 10 ? "" : " "}** <@${userData.id}>`);
      convertedUserMessages2.push(
        `> \`${isVoice ? userData.getVoiceLevel() : userData.getMessageLevel()}\``,
      );
      convertedUserMessages3.push(`> \`${isVoice ? userData.voiceExp : userData.messageExp}\``);

      combined.push(
        `| **#${index + 1}${index < 10 ? "" : " "}** <@${userData.id}> | \`${isVoice ? userData.getVoiceLevel() : userData.getMessageLevel()}\` | \`${isVoice ? userData.voiceExp : userData.messageExp}\` |`,
      );
    });

    const interactionUserProfile = await this.memberRepo.getRankIncluded(
      interaction.user.id,
      interaction.guildId,
      isVoice,
    );

    const containerBuilder = new ContainerBuilder()
      .setAccentColor(Colors.Blurple)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${interaction.guild.name}`),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# Bảng xếp hạng top ${convertedUserMessages.length} ${isVoice ? "VC" : "tin nhắn"}`,
        ),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> *Rank của bạn - <@${interaction.user.id}>: #${interactionUserProfile.rank}*`,
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [`| User | Level | Exp |`, `| ... | ... | ... |`, ...combined].join("\n"),
        ),
      )
      // .addTextDisplayComponents(
      //   new TextDisplayBuilder().setContent(
      //     convertedUserMessages
      //       .map((user, index) => `${user}　　${convertedUserMessages2[index]}　　${convertedUserMessages3[index]}`)
      //       .join("\n"),
      //   ),
      // )
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# UID: ${interaction.user.id}`),
      );

    const embedBuilder = new EmbedBuilder({
      author: {
        name: interaction.guild.name,
        iconURL: interaction.guild.iconURL()!,
      },
      title: `Bảng xếp hạng top ${convertedUserMessages.length} ${isVoice ? "VC" : "tin nhắn"}`,
      description: `> *Rank của bạn - <@${interaction.user.id}>: #${interactionUserProfile.rank}*`,
      timestamp: new Date(),
      fields: [
        { name: "User", value: convertedUserMessages.join("\n"), inline: true },
        {
          name: "level",
          value: convertedUserMessages2.join("\n"),
          inline: true,
        },
        { name: "Xp", value: convertedUserMessages3.join("\n"), inline: true },
      ],
      footer: {
        iconURL: interaction.user.avatarURL()!,
        text: `UID:${interaction.user.id}`,
      },
      color: Colors.Blurple,
    });

    // await interaction.editReply({ components: [containerBuilder], flags: MessageFlags.IsComponentsV2 });
    await interaction.editReply({ embeds: [embedBuilder] });
  }

  @SlashCommandExecutor({ guildOnly: true, defered: true })
  async getMemberLevel(interaction: ChatInputCommandInteraction<"cached">) {
    let target = interaction.options.getMember("member");
    if (!target) target = interaction.member;

    let guildProfile = await this.getGuildProfile(target.guild.id);

    if (!guildProfile.active) return;

    let profile = await this.getMemberProfile(target);

    const messageLevel = calcLevel(profile.messageExp);
    const voiceLevel = calcLevel(profile.voiceExp);
    const guildMilestone = guildProfile.milestones.find((value) => value.id == profile.milestoneId);
    const milestoneRole = await interaction.guild.roles.fetch(guildMilestone?.roleId ?? "");

    const profileRank = await this.memberRepo.getRankIncluded(profile.id, profile.guildId, false);
    const profileRank2 = await this.memberRepo.getRankIncluded(profile.id, profile.guildId, true);

    if (guildProfile.type == 1) {
      const firstCol: string[] = [
        `:bust_in_silhouette: **Message Level:**`,
        `:chart_with_upwards_trend: **Progress:**`,
        ` `,
        `:bust_in_silhouette: **Voice Level:**`,
        `:chart_with_upwards_trend: **Progress:**`,
        ` `,
        `:trophy: **Milestone:**`,
      ];

      const secondCol: string[] = [
        `***${messageLevel} (${profile.messageExp} exp)***`,
        craftEmbedProgressBar(calcPercentageOfProgress(profile.messageExp)),
        ` `,
        `***${voiceLevel} (${profile.voiceExp} exp)***`,
        craftEmbedProgressBar(calcPercentageOfProgress(profile.voiceExp)),
        ` `,
        `***${"No data"}***`,
      ];

      const embed = new EmbedBuilder({
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.avatarURL()!,
        },
        color: Colors.Blurple,
        fields: [
          {
            name: "Info",
            value: firstCol.join("\n"),
            inline: true,
          },
          {
            name: "Value",
            value: secondCol.join("\n"),
            inline: true,
          },
        ],
      }).setTimestamp();

      await sendInteractionMessageReply(interaction, { embeds: [embed] });
    } else {
      const avatar = target.displayAvatarURL() ?? target.avatarURL() ?? avatarPath;

      const buffer = await generateRankCard({
        userInf: {
          name: target.displayName,
          avatarUrl: avatar,
        },
        msgLvlData: {
          expValue: profile.messageExp,
          rank: profileRank.rank,
        },
        vcLvlData: {
          expValue: profile.voiceExp,
          rank: profileRank2.rank,
        },
      });

      const attachment = new AttachmentBuilder(buffer, {
        name: `${target.id}/${new Date().getTime()}.png`,
      });

      await interaction.editReply({ files: [attachment] });
    }
  }
}
