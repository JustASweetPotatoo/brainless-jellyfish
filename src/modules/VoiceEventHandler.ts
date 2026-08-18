import {
  ChannelType,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  EmbedBuilder,
  Events,
  Guild,
  TextChannel,
  VoiceState,
} from "discord.js";

import GuildVoiceLoggerConfig from "../database/model/logger/GuildVoiceLoggerConfig";
import GuildVoiceLoggerConfigRepo from "../database/repository/guildLogger/GuildVoiceLoggerConfigRepo";
import ClientModule from "./core/ClientModule";
import { On, Repository, SlashCommandExecutor } from "./core/decorators";
import { sendInteractionMessageReply } from "../utils/replier";
import { MemberVoiceStateEvents } from "./LevelProvider";

export enum GetChannelResultCode {
  NOT_EXIST = 0,
  NO_ID = 1,
  MISSING_PERMISSION = 2,
  FETCH_FAILED = 3,
}

export interface VoiceSession {
  userId: string;
  channelId: string;
  guildId: string;
  joinTimestamp: number;
}

export default class VoiceEventHandler extends ClientModule<"voice-event-handler"> {
  @Repository()
  private readonly repo: GuildVoiceLoggerConfigRepo;
  private readonly guildProfileCache: Collection<string, GuildVoiceLoggerConfig> = new Collection();
  private readonly channelCache: Collection<string, TextChannel> = new Collection();
  private readonly voiceSessions: Collection<string, VoiceSession> = new Collection();

  private async getProfile(guild: Guild): Promise<GuildVoiceLoggerConfig> {
    let guildProfile = this.guildProfileCache.get(guild.id);
    if (!guildProfile) {
      guildProfile = await this.repo.get({ id: guild.id, autoCreate: true });
      this.guildProfileCache.set(guildProfile.id, guildProfile);
    }

    return guildProfile;
  }

  private async getChannel(
    guildProfile: GuildVoiceLoggerConfig,
  ): Promise<TextChannel | GetChannelResultCode> {
    let channel = this.channelCache.get(guildProfile.getChannelCacheId());

    if (!channel) {
      if (!guildProfile.channelId || guildProfile.channelId.length == 0) {
        return GetChannelResultCode.NO_ID;
      }

      let error;
      const guild = await this.client.guilds.fetch(guildProfile.id);
      channel = await guild.channels
        .fetch(guildProfile.channelId ?? "")
        .catch((error) => (error = error));
      if (error) return GetChannelResultCode.FETCH_FAILED;

      if (!channel) return GetChannelResultCode.NOT_EXIST;
    }

    return channel;
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

  @SlashCommandExecutor({ guildOnly: true, deferred: true, ephemeral: true })
  async setChannel(interaction: ChatInputCommandInteraction<"cached">) {
    const targetChannel = interaction.options.getChannel("channel", true, [ChannelType.GuildText]);
    const guildConfig = await this.getProfile(interaction.guild);

    if (guildConfig.channelId) {
      this.channelCache.delete(`${guildConfig.channelId}:${guildConfig.id}`);
      await sendInteractionMessageReply(interaction, {
        embeds: [
          {
            title: "Operation Complete !",
            description: `Record for voice event in channel <#${guildConfig.channelId}> disabled`,
            color: Colors.Green,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      guildConfig.channelId = undefined;
    } else {
      guildConfig.channelId = targetChannel.id;
      this.channelCache.set(`${guildConfig.channelId}:${guildConfig.id}`, targetChannel);

      await sendInteractionMessageReply(interaction, {
        embeds: [
          {
            title: "Operation Complete !",
            description: `Voice events will now be recorded in the channel <#${targetChannel.id}>`,
            color: Colors.Green,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    this.guildProfileCache.set(guildConfig.id, guildConfig);
    await this.repo.update(guildConfig);
  }

  @SlashCommandExecutor({ guildOnly: true, deferred: true, ephemeral: true })
  async activeGuild(interaction: ChatInputCommandInteraction<"cached">) {
    const guildProfile = await this.getProfile(interaction.guild);

    guildProfile.active = !guildProfile.active;
    await this.repo.update(guildProfile);

    const embed = new EmbedBuilder()
      .setTitle("Operation complete !")
      .setDescription(guildProfile.active ? "Đã bật VoiceLogger" : "Đã tắt VoiceLogger")
      .setColor(Colors.Green)
      .setTimestamp()
      .setFooter({ text: `UID: ${interaction.user.id}` });

    await interaction.editReply({ embeds: [embed] });
  }

  @On(Events.VoiceStateUpdate)
  async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    const guildProfile = await this.getProfile(oldState.guild);
    const channel = await this.getChannel(guildProfile);
    const eventTimestamp = Math.floor(new Date().getTime() / 1000);

    if (!oldState.member || !newState.member) return;

    const cacheId = `${oldState.member.id}|${oldState.channelId ?? newState.channelId}|${oldState.guild.id}`;

    if (channel instanceof TextChannel) {
      const memberState = this.classifyVoiceState(oldState, newState);

      if (memberState == MemberVoiceStateEvents.JOIN) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: oldState.member.displayName,
            iconURL: oldState.member.displayAvatarURL(),
          })
          .setDescription(
            `**<@${oldState.member.id}> joined voice channel: <#${newState.channel?.id}>**`,
          )
          .setColor(Colors.Blurple)
          .setFooter({ text: `UID: ${oldState.member.id}` })
          .setTimestamp();
        await channel.send({ embeds: [embed] });
        const voiceChannelId = oldState.channelId || newState.channelId;
        this.voiceSessions.set(cacheId, {
          userId: oldState.member.id,
          channelId: voiceChannelId || "000",
          guildId: oldState.guild.id,
          joinTimestamp: eventTimestamp,
        });
      }

      if (memberState == MemberVoiceStateEvents.LEAVE) {
        const voiceSession = this.voiceSessions.get(cacheId);
        const sessionDuration = voiceSession
          ? eventTimestamp - voiceSession.joinTimestamp
          : undefined;

        const embed = new EmbedBuilder()
          .setAuthor({
            name: oldState.member.displayName,
            iconURL: oldState.member.displayAvatarURL()!,
          })
          .setDescription(
            `**<@${oldState.member.id}> joined voice channel: <#${newState.channel?.id}>**${sessionDuration ? `\n> Duration: ${sessionDuration}s` : ""}`,
          )
          .setColor(Colors.Red)
          .setFooter({ text: `UID: ${oldState.member.id}` })
          .setTimestamp();
        await channel.send({ embeds: [embed] });
        this.voiceSessions.delete(cacheId);
      }
    } else {
      this.handleClientError(channel);
    }
  }
}
