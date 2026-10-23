import { EventEmitter } from "stream";
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
  Guild,
  GuildMember,
  Message,
  Role,
  SeparatorBuilder,
  TextChannel,
  TextDisplayBuilder,
  VoiceState,
} from "discord.js";

import { PremiumStatus } from "../database/model/GuildStatus";
import Repo_MemberLevel from "../database/repository/UserLevelProfileRepo";
import { ModuleOn, On, Repository, SlashCommandExecutor } from "./core/decorators/decorators";
import DiscordModule from "./core/module/DiscordModule";
import MemberLevel, { UserLevelProfileJson } from "../database/model/UserLevelProfile";
import Repo_LevelProviderGuildProfile from "../database/repository/LevelProviderGuildProfileRepo";
import LevelProviderGuildProfile, {
  LevelProviderGuildProfileObj,
} from "../database/model/LevelProviderGuildProfile";
import {
  calcLevel,
  calcPercentageOfProgress,
  craftEmbedProgressBar,
  getRandomInt,
  getTotalExpToReachLevel,
} from "../utils/calculator";
import {
  createCompositeKey,
  getHashValueObject,
  parseCompositeKey,
  setHashValueObject,
} from "../utils/redis";
import RankProviderMilestone from "../database/model/LevelProviderMilestone";
import generateRankCard from "../utils/rankCard";
import { sendInteractionMessageReply } from "../utils/replier";

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

const rd_guildKey = (guildId: string) => `guild:${guildId}:level-provider:config`;
const rd_memberKey = (guildId: string, memberId: string) =>
  `guild:${guildId}:exp:member:${memberId}`;
const rd_voiceSesionKey = (guildId: string, memberId: string) =>
  `guild:${guildId}:voice:session:${memberId}`;

const castExp = (content: string, rate = 1) => {
  const [maxLength, maxSplitedLength] = [500, 150];
  const [contentLength, splitedLength] = [content.length, content.split(" ").length];
  const firstRatio = maxLength > contentLength ? 1.0 : maxLength / contentLength;
  const secondRatio = maxSplitedLength > splitedLength ? 1.0 : maxSplitedLength / splitedLength;
  const avg = (firstRatio + secondRatio) / 2;
  const ratio = avg / 2 < 0.5 ? 0.5 : avg / 2;

  return Math.ceil(getRandomInt(25, 35) * ratio * rate);
};

export type MemberCompositeKey = string;

export default class LevelProvider extends DiscordModule<"level-provider"> {
  readonly webManaged: boolean = false;
  protected premiumLevel: PremiumStatus = PremiumStatus.STANDARD;
  private readonly channelCache: Collection<string, TextChannel | undefined> = new Collection();
  private emiiter: EventEmitter = new EventEmitter();
  private queue: Collection<MemberCompositeKey, boolean>;

  @Repository()
  readonly memberRepo: Repo_MemberLevel;

  @Repository()
  readonly guildRepo: Repo_LevelProviderGuildProfile;

  public async getChannel(guild: Guild): Promise<TextChannel | undefined> {
    const p = await this.getGuild(guild.id);

    const compositeKey = createCompositeKey(guild.id, p.logChannelId ?? "");
    if (this.channelCache.has(compositeKey)) {
      return this.channelCache.get(compositeKey);
    }

    const cachedChannel = guild.channels.cache.get(p.logChannelId ?? "");
    if (cachedChannel instanceof TextChannel) {
      this.channelCache.set(compositeKey, cachedChannel);
      return cachedChannel;
    }

    return;
  }

  public async getChannelId(guildId: string): Promise<string | undefined> {
    const redisCache = await this.redisGetGuild(guildId);
    if (redisCache) return redisCache.logChannelId;

    const profile = await this.guildRepo.get(guildId);
    await this.redisSetGuild(profile);

    return profile.logChannelId;
  }

  private async redisGetGuild(guildId: string): Promise<LevelProviderGuildProfile | undefined> {
    const redisCache = await getHashValueObject(this.redis, rd_guildKey(guildId));
    if (redisCache)
      return LevelProviderGuildProfile.fromJSON(redisCache as LevelProviderGuildProfileObj);
  }

  private async redisSetGuild(p: LevelProviderGuildProfile): Promise<void> {
    return await setHashValueObject(this.redis, rd_guildKey(p.id), p.toJSON());
  }

  private async redisGetMember(guildId: string, id: string): Promise<MemberLevel | undefined> {
    const res = await getHashValueObject(this.redis, rd_memberKey(guildId, id));

    if (res) {
      const p = new MemberLevel(res as UserLevelProfileJson);
      return p;
    }
  }

  private async redisSetMember(p: MemberLevel): Promise<void> {
    await setHashValueObject(this.redis, rd_memberKey(p.guildId, p.id), p.toJSON());
  }

  private async redisIncrMember(
    guildId: string,
    id: string,
    type: "text" | "voice",
    value: number = 0,
  ) {
    type == "text"
      ? await this.redis.hIncrBy(rd_memberKey(guildId, id), "text_exp", value)
      : await this.redis.hIncrBy(rd_memberKey(guildId, id), "voice_exp", value);
  }

  private async redisGetVoiceSession(member: GuildMember): Promise<MemberVoiceSession | undefined> {
    const cache = await getHashValueObject(
      this.redis,
      rd_voiceSesionKey(member.guild.id, member.id),
    );
    if (cache) return cache as MemberVoiceSession;
  }

  private async redisSetVoiceSession(voiceSession: MemberVoiceSession) {
    await setHashValueObject(
      this.redis,
      rd_voiceSesionKey(voiceSession.guildId, voiceSession.id),
      voiceSession,
    );
  }

  private async redisClearVoiceSession(member: GuildMember): Promise<boolean> {
    const status = await this.redis.unlink(rd_voiceSesionKey(member.guild.id, member.id));
    return status == 1;
  }

  async flushQueue(): Promise<void> {
    for (const [key, value] of this.queue) {
      const [guildId, id] = parseCompositeKey(key);
      const p = await this.getMember(guildId, id);
      await this.memberRepo.update(p);
    }
  }

  private async setMember(p: MemberLevel) {
    await this.redisSetMember(p);
    await this.memberRepo.update(p);
  }

  private async getMember(guildId: string, id: string) {
    const cache = await this.redisGetMember(guildId, id);
    if (cache) return cache;

    let p = await this.memberRepo.get({ id: id, guildId: guildId });
    await this.redisSetMember(p);

    return p;
  }

  private async getGuild(guildId: string) {
    const cache = await this.redisGetGuild(guildId);
    if (cache) return cache;

    let p = await this.guildRepo.get(guildId);
    await this.redisSetGuild(p);
    return p;
  }

  private async setGuild(p: LevelProviderGuildProfile) {
    await this.redisSetGuild(p);
    await this.guildRepo.update(p);
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

  private createVoiceSession(
    member: GuildMember,
    openMic = false,
    openMicTimestamp?: number,
  ): MemberVoiceSession {
    return {
      id: member.id,
      guildId: member.guild.id,
      joinTimestamp: new Date().getTime(),
      bonusEpx: 0,
      isOpenMic: openMic,
      lastOpenMicTimestamp: openMicTimestamp,
    };
  }

  // Voice events
  @ModuleOn(MemberVoiceStateEvents.JOIN)
  private async userJoinVoiceEvent(member: GuildMember) {
    let session = await this.redisGetVoiceSession(member);
    if (session) return;

    session = this.createVoiceSession(
      member,
      member.voice?.selfMute ?? true,
      member.voice?.mute ? undefined : Date.now(),
    );

    await this.redisSetVoiceSession(session);
  }

  @ModuleOn(MemberVoiceStateEvents.LEAVE)
  private async userLeaveVoiceEvent(member: GuildMember) {
    const session = await this.redisGetVoiceSession(member);
    if (!session) return;

    let expBonus = 0;

    if (session.isOpenMic) {
      expBonus +=
        Math.floor(((Date.now() - (session.lastOpenMicTimestamp ?? Date.now())) / 60000) * 0.5) *
        getRandomInt(25, 35);
    }

    const expByMinutes =
      Math.floor(((Date.now() - session.joinTimestamp) / 60000) * 0.1) * getRandomInt(25, 35);

    await this.redisIncrMember(
      member.guild.id,
      member.id,
      "voice",
      session.bonusEpx + expBonus + expByMinutes,
    );

    await this.redisClearVoiceSession(member);
  }

  @ModuleOn(MemberVoiceStateEvents.MUTE)
  private async userMuteEvent(member: GuildMember) {
    const voiceState = member.voice;
    if (!voiceState) return;
    let session = await this.redisGetVoiceSession(member);

    if (!session) {
      session = this.createVoiceSession(
        member,
        member.voice?.selfMute ?? true,
        member.voice?.mute ? undefined : Date.now(),
      );
    }

    if (session.isOpenMic) {
      session.isOpenMic = false;
    }

    const timeByMiliseconds = Date.now() - (session.lastOpenMicTimestamp ?? Date.now());

    const expBonus =
      Math.floor(((timeByMiliseconds > 0 ? timeByMiliseconds : 0) / 60000) * 0.5) *
      getRandomInt(25, 35);

    session.bonusEpx += expBonus;
    await this.redisSetVoiceSession(session);
  }

  @ModuleOn(MemberVoiceStateEvents.UNMUTE)
  private async userUnmuteEvent(member: GuildMember) {
    if (!member.voice) return;

    let session = await this.redisGetVoiceSession(member);
    if (!session) {
      session = this.createVoiceSession(
        member,
        member.voice?.selfMute ?? true,
        member.voice?.mute ? undefined : Date.now(),
      );
    }

    session.lastOpenMicTimestamp = Date.now();
    await this.redisSetVoiceSession(session);
  }

  // Message events
  @ModuleOn(MessageLevelEvents.USER_LEVEL_UP)
  private async onUserLevelUp(member: GuildMember, profile: MemberLevel): Promise<MemberLevel> {
    const guildProfile = await this.getGuild(member.guild.id);

    const newLevel = calcLevel(profile.textExp);

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

    await this.redisSetMember(profile);
    return profile;
  }

  private async sendLevelUpMessage(
    member: GuildMember,
    newLevel: number,
    newMilestone?: RankProviderMilestone,
  ) {
    const channelId = await this.getChannelId(member.guild.id);
    if (!channelId) return;

    const channel = await this.getChannel(member.guild);
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

  private async messageCreateEmiiter(message: Message<true>) {
    if (!message.member) return;
    const isActive = await this.client.guildStatusManager.isActive(message.guildId, this.name);
    if (!isActive) return;

    let memberProfile = await this.getMember(message.guildId, message.author.id);
    const oldLevel = calcLevel(memberProfile.textExp);
    const exp = memberProfile.textExp + castExp(message.content);
    const newLevel = calcLevel(exp);
    memberProfile.textExp = exp;

    if (oldLevel !== newLevel) {
      await this.onUserLevelUp(message.member, memberProfile);
    }

    await this.redisIncrMember(memberProfile.guildId, memberProfile.id, "text", exp);
  }

  @On(Events.MessageCreate, true)
  protected async onMessageCreate(message: Message<true>): Promise<void> {
    const compositeKey = createCompositeKey(message.guildId, "text");
    const isListening = this.emiiter.emit(compositeKey, message);

    if (!isListening) {
      const p = await this.getGuild(message.guild.id);
      if (!p.active || !p.logChannelId) {
        this.emiiter.on(compositeKey, () => {});
      } else {
        this.emiiter.on(compositeKey, this.messageCreateEmiiter);
      }
    }
  }

  private async voiceStateUpdateEmitter(oldState: VoiceState, newState: VoiceState) {
    const member = oldState.member || newState.member;
    if (!member || member.user.bot) return;
    const guildProfile = await this.getGuild(member.guild.id);
    if (!guildProfile.active) return;

    const memberEvent = this.classifyVoiceState(oldState, newState);
  }

  @On(Events.VoiceStateUpdate, true)
  protected async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<any> {
    const compositeKey = createCompositeKey(oldState.guild.id, "voice");
    const isListening = this.emiiter.emit(compositeKey, oldState, newState);

    if (!isListening) {
      const p = await this.getGuild(oldState.guild.id);

      if (!p.active || !p.logChannelId) {
        this.emiiter.on(compositeKey, () => {});
      } else {
        this.emiiter.on(compositeKey, this.voiceStateUpdateEmitter);
      }
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
    const target = interaction.options.getMember("user") ?? interaction.member;

    if (!(target instanceof GuildMember)) {
      return;
    }

    if (!interaction.inCachedGuild()) {
      return;
    }

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

    const userProfile = await this.getMember(target.guild.id, target.id);
    const isMessageType = !isVoice;
    const previousLevel = calcLevel(isVoice ? userProfile.voiceExp : userProfile.textExp);

    if (type === "exp") {
      userProfile.textExp = amount;
    } else {
      userProfile.textExp = getTotalExpToReachLevel(amount);
    }

    const newLevel = calcLevel(isVoice ? userProfile.voiceExp : userProfile.textExp);
    await this.setMember(userProfile);

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

  @SlashCommandExecutor({ guildOnly: true, deferred: true })
  async switchModule(interaction: ChatInputCommandInteraction<"cached">) {
    const disable = interaction.options.getBoolean("disable")!;
    let status;
    if (disable) {
      status = await this.client.moduleManager.disableModule(interaction.guild.id, this.name);
    } else {
      status = await this.client.moduleManager.enableModule(interaction.guild.id, this.name);
    }

    const guildProfile = await this.getGuild(interaction.guildId);

    if (status == "already") {
      const embed = new EmbedBuilder()
        .setTitle("Opearation complete !")
        .setDescription(disable ? "Module đã tắt trước đó" : "Module đã bật trước đó")
        .setColor(Colors.Yellow)
        .setTimestamp()
        .setFooter({ text: `UID: ${interaction.user.id}` });

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    guildProfile.active = status == "enabled";
    await this.setGuild(guildProfile);

    const embed = new EmbedBuilder()
      .setTitle("Opearation complete !")
      .setDescription(guildProfile.active ? "Module đã được bật!" : "module đã được tắt!")
      .setColor(Colors.Green)
      .setTimestamp()
      .setFooter({ text: `UID: ${interaction.user.id}` });

    await interaction.editReply({ embeds: [embed] });
  }

  @SlashCommandExecutor({ deferred: true })
  async setChannel(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const guildProfile = await this.getGuild(guildId);

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
    await this.setGuild(guildProfile);

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
    profile: LevelProviderGuildProfile,
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
    await this.setGuild(profile);

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

    const prof = await this.getGuild(guild.id);

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

    const prof = await this.getGuild(guildId);

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

    const guildProf = await this.getGuild(guild.id);

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

    await this.setGuild(guildProf);

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
    const guildProf = await this.getGuild(interaction.guild.id);
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
      convertedUserMessages3.push(`> \`${isVoice ? userData.voiceExp : userData.textExp}\``);

      combined.push(
        `| **#${index + 1}${index < 10 ? "" : " "}** <@${userData.id}> | \`${isVoice ? userData.getVoiceLevel() : userData.getMessageLevel()}\` | \`${isVoice ? userData.voiceExp : userData.textExp}\` |`,
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
    let target = interaction.options.getMember("member") ?? interaction.member;

    if (!(target instanceof GuildMember)) {
      return;
    }

    let isActive = await this.client.guildStatusManager.isActive(target.guild.id, this.name);
    let guildProfile = await this.getGuild(target.guild.id);

    if (!isActive) {
      // reply !

      return;
    }

    let profile = await this.getMember(target.guild.id, target.id);

    const messageLevel = calcLevel(profile.textExp);
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
        `***${messageLevel} (${profile.textExp} exp)***`,
        craftEmbedProgressBar(calcPercentageOfProgress(profile.textExp)),
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
          expValue: profile.textExp,
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
