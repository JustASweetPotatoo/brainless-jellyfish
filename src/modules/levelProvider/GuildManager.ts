import {
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  GuildMember,
} from "discord.js";
import ClientModule from "../core/ClientModule";

import GuildLevelProviderProfile from "../../database/model/RankProviderGuildProfile";
import UserLevelProfile from "../../database/model/UserLevelProfile";
import GuildLevelProviderProfileRepo from "../../database/repository/LevelProviderGuildConfigRepo";
import UserlevelProfileRepo from "../../database/repository/UserLevelProfileRepo";
import { Repository } from "../core/decorators";
import { autoDeferReplyInteraction } from "../../slashCommandBuilder/function";
import { MessageLevelProviderEvents } from "./MessageLevelProvider";

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

  private readonly guildProfileCache: Collection<
    string,
    GuildLevelProviderProfile
  > = new Collection();
  private readonly userProfileCache: Collection<string, UserLevelProfile> =
    new Collection();

  @Repository()
  readonly guildRepo: GuildLevelProviderProfileRepo;
  @Repository()
  readonly userRepo: UserlevelProfileRepo;

  async activeGuild(interaction: ChatInputCommandInteraction) {
    await autoDeferReplyInteraction(interaction, { ephemeral: true });
    if (!interaction.inGuild()) return;
    const guildProfile = await this.getGuildProfile(interaction.guildId);

    if (!guildProfile) {
      return;
    }

    guildProfile.active = !guildProfile.active;
    await this.update(guildProfile);
    this.client.moduleManager
      .get("message-level-provider")
      .emit(MessageLevelProviderEvents.GUILD_ACTIVE, guildProfile);

    const embed = new EmbedBuilder()
      .setTitle("Action complete !")
      .setDescription(
        guildProfile.active
          ? "Đã bật hệ thống level !"
          : "Đã tắt hệ thông level",
      )
      .setColor(Colors.Green)
      .setTimestamp()
      .setFooter({ text: `UID: ${interaction.user.id}` });

    await interaction.editReply({ embeds: [embed] });
  }

  async changeLogChannel(interaction: ChatInputCommandInteraction) {
    await autoDeferReplyInteraction(interaction, { ephemeral: true });
    if (!interaction.inGuild()) return;
    const guildProfile = await this.getGuildProfile(interaction.guildId);

    if (!guildProfile) {
      return;
    }

    const newChannel = interaction.options.getChannel("channel", true, [
      ChannelType.GuildText,
    ]);

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

  private async update(guildProfile: GuildLevelProviderProfile) {
    this.guildProfileCache.set(guildProfile.id, guildProfile);
    await this.guildRepo.update(guildProfile);
  }
}
