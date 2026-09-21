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

import { On } from "../core/decorators";
import { ModuleOptions } from "../core/BaseModule";
import EventHandler from "./EventHandler";
import { LogChannelType } from "../GuildStatusManager";

export enum MemberVoiceStateEvents {
  MUTE = "voiceMute",
  UNMUTE = "voiceUnmute",
  JOIN = "voiceJoin",
  LEAVE = "voiceLeave",
  CHANGE = "voiceChannelChange",
}

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

export default class VoiceEventHandler extends EventHandler<"voice-event-handler"> {
  private readonly voiceSessions: Collection<string, VoiceSession> = new Collection();

  protected override getLogChannelType(): LogChannelType {
    return LogChannelType.VOICE;
  }

  constructor(options: ModuleOptions) {
    super(options, "nhật ký VC");
  }

  private classifyVoiceState(oldState: VoiceState, newState: VoiceState): MemberVoiceStateEvents {
    if (oldState.channelId && !newState.channelId) {
      return MemberVoiceStateEvents.LEAVE;
    } else if (!oldState.channelId && newState.channelId) {
      return MemberVoiceStateEvents.JOIN;
    } else if (!oldState.mute && newState.mute) {
      return MemberVoiceStateEvents.MUTE;
    } else if (oldState.mute && !newState.mute) {
      return MemberVoiceStateEvents.UNMUTE;
    } else {
      return MemberVoiceStateEvents.CHANGE;
    }
  }

  @On(Events.VoiceStateUpdate, true)
  async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.member || !newState.member) return;

    const guild = oldState.guild;
    const logChannel = await this.processActivation(guild, LogChannelType.VOICE);
    const eventTimestamp = Math.floor(new Date().getTime() / 1000);

    if (logChannel instanceof TextChannel) {
      const memberState = this.classifyVoiceState(oldState, newState);
      const cacheId = `${oldState.member.id}|${oldState.channelId ?? newState.channelId}|${oldState.guild.id}`;

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
        await logChannel.send({ embeds: [embed] });
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
            `**<@${oldState.member.id}> leaved voice channel: <#${oldState.channel?.id}>**${sessionDuration ? `\n> Duration: ${sessionDuration}s` : ""}`,
          )
          .setColor(Colors.Red)
          .setFooter({ text: `UID: ${oldState.member.id}` })
          .setTimestamp();
        await logChannel.send({ embeds: [embed] });
        this.voiceSessions.delete(cacheId);
      }

      if (memberState == MemberVoiceStateEvents.CHANGE) {
        let voiceSession = this.voiceSessions.get(cacheId);
        const sessionDuration = voiceSession
          ? eventTimestamp - voiceSession.joinTimestamp
          : undefined;

        const embed = new EmbedBuilder()
          .setAuthor({
            name: oldState.member.displayName,
            iconURL: oldState.member.displayAvatarURL()!,
          })
          .setDescription(
            `**<@${oldState.member.id}> changed channel: **\n**Before:** <#${oldState.channelId}>\n**After: <#${newState.channelId}>**${sessionDuration ? `\n-# Duration: ${sessionDuration}s` : ""}`,
          )
          .setColor(Colors.Yellow)
          .setFooter({ text: `UID: ${oldState.member.id}` })
          .setTimestamp();
        await logChannel.send({ embeds: [embed] });

        if (!voiceSession) {
          voiceSession = {
            channelId: newState.channelId!,
            guildId: newState.guild.id,
            joinTimestamp: eventTimestamp,
            userId: newState.member.id,
          };
        }
        const newCacheId = `${oldState.member.id}|${newState.channelId}|${oldState.guild.id}`;

        this.voiceSessions.set(newCacheId, voiceSession);
        this.voiceSessions.delete(cacheId);
      }
    }
  }
}
