import {
  APIRole,
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  GuildMember,
  Role,
} from "discord.js";
import ClientModule from "../core/ClientModule";

import GuildLevelProviderProfile from "../../database/model/RankProviderGuildProfile";
import UserLevelProfile from "../../database/model/UserLevelProfile";
import GuildLevelProviderProfileRepo from "../../database/repository/LevelProviderGuildConfigRepo";
import UserlevelProfileRepo from "../../database/repository/UserLevelProfileRepo";
import { CommandExecutor, GuildOnly, Repository } from "../core/decorators";
import { autoDeferReplyInteraction } from "../../slashCommandBuilder/function";
import { MessageLevelProviderEvents } from "./MessageLevelProvider";
import RankProviderMilestone from "../../database/model/RankProviderMilestone";
import { calcLevel } from "../../utils/calculator";

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

export default class GuildLevelManager extends ClientModule<"guild-level-manager"> {
  readonly discordEvents: Events[] = [];

  private readonly guildProfileCache: Collection<string, GuildLevelProviderProfile> = new Collection();
  private readonly userProfileCache: Collection<string, UserLevelProfile> = new Collection();

  @Repository()
  readonly guildRepo: GuildLevelProviderProfileRepo;
  @Repository()
  readonly userRepo: UserlevelProfileRepo;

  @CommandExecutor()
  @GuildOnly()
  async updateMemberLevel(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString("type", true)?.toLowerCase();
    const amount = interaction.options.getNumber("amount", true);
    const isVoice = interaction.options.getBoolean("is-voice-level") ?? false;
    const targetUser = interaction.options.getUser("user");

    const member = interaction.member;
    if (!member || !("id" in member) || !("guild" in member)) {
      return;
    }

    const targetMember = targetUser ? await member.guild.members.fetch(targetUser.id).catch(() => null) : null;
    const target = targetMember ?? member;

    if (typeof amount !== "number" || Number.isNaN(amount)) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: "Operation failed",
            description: "Amount must be a valid number !",
            color: Colors.Yellow,
            footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
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
            footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
          }).setTimestamp(),
        ],
      });
      return;
    }

    const userProfile = await this.getUserProfile(target as GuildMember);
    const isMessageType = !isVoice;
    const previousLevel = calcLevel(isVoice ? userProfile.voiceExp : userProfile.messageExp);

    if (type === "exp") {
      userProfile.addExp(isMessageType, amount);
    } else {
      userProfile.addLevel(isMessageType, amount);
    }

    const newLevel = calcLevel(isVoice ? userProfile.voiceExp : userProfile.messageExp);
    this.userProfileCache.set(userProfile.getCacheId(), userProfile);

    if (isVoice) {
      await this.userRepo.updateByVoiceLevel(userProfile);
    } else {
      await this.userRepo.updateByMessageLevel(userProfile);
    }

    if (previousLevel !== newLevel) {
      this.client.moduleManager
        .get("message-level-provider")
        .emit(MessageLevelProviderEvents.USER_LEVEL_UP, target, userProfile);
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          title: "Operation complete !",
          description: `Updated ${isVoice ? "voice" : "message"} ${type === "exp" ? "exp" : "level"} for <@${target.id}>`,
          color: Colors.Green,
          footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
        }).setTimestamp(),
      ],
    });
  }

  @CommandExecutor()
  @GuildOnly()
  async activeGuild(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const guildProfile = await this.getGuildProfile(guildId);

    if (!guildProfile) {
      return;
    }

    guildProfile.active = !guildProfile.active;
    await this.update(guildProfile);
    this.client.moduleManager.get("message-level-provider").emit(MessageLevelProviderEvents.GUILD_ACTIVE, guildProfile);

    const embed = new EmbedBuilder()
      .setTitle("Action complete !")
      .setDescription(guildProfile.active ? "Đã bật hệ thống level !" : "Đã tắt hệ thông level")
      .setColor(Colors.Green)
      .setTimestamp()
      .setFooter({ text: `UID: ${interaction.user.id}` });

    await interaction.editReply({ embeds: [embed] });
  }

  @CommandExecutor()
  @GuildOnly()
  async changeLogChannel(interaction: ChatInputCommandInteraction) {
    await autoDeferReplyInteraction(interaction, { ephemeral: true });
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
    await this.update(guildProfile);

    this.client.moduleManager
      .get("message-level-provider")
      .emit(MessageLevelProviderEvents.LOG_CHANNEL_CHANGE, guildProfile);

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

  private async getGuildProfile(guildId: string): Promise<GuildLevelProviderProfile> {
    let guildProfile = this.guildProfileCache.get(guildId);
    if (!guildProfile) guildProfile = (await this.guildRepo.get(guildId))!;
    if (!guildProfile) guildProfile = new GuildLevelProviderProfile({ id: guildId });
    return guildProfile;
  }

  private async getUserProfile(member: GuildMember) {
    let userProfile = this.userProfileCache.get(`${member.id}|${member.guild.id}`);
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

  private async update(guildProfile: GuildLevelProviderProfile) {
    this.guildProfileCache.set(guildProfile.id, guildProfile);
    await this.guildRepo.update(guildProfile);
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
      .setFooter({ text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.editReply({ embeds: [embed] });
  }

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
    await this.update(profile);

    await this.replyWithEmbed(
      interaction,
      "Operation complete !",
      `${type === "role" ? "Role" : "Channel"} ${label} has been added to blacklist !`,
      Colors.Green,
    );
    return true;
  }

  @CommandExecutor()
  @GuildOnly()
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
          footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
        }).setTimestamp(),
      ],
    });
  }

  @CommandExecutor()
  @GuildOnly()
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

  @CommandExecutor()
  @GuildOnly()
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
            footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
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
            footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
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
            footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
          }).setTimestamp(),
        ],
      });
      return;
    }

    const guildProf = await this.getGuildProfile(guild.id);

    for (const [, milestone] of guildProf.milestones) {
      if (milestone.startAt == lowLevel && milestone.endAt == highLevel && milestone.roleId == role.id) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder({
              title: "Operation failed",
              description: `Duplicate entries !`,
              color: Colors.Yellow,
              footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
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
              footer: { text: `UID:${interaction.user.id}`, iconURL: interaction.user.displayAvatarURL() },
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

    await this.update(guildProf);

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
}
