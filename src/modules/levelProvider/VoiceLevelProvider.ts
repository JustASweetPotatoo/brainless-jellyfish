import GuildLevelProviderProfile from "../../database/model/RankProviderGuildProfile";
import UserLevelProfile from "../../database/model/UserLevelProfile";
import GuildLevelProviderProfileRepo from "../../database/repository/LevelProviderGuildConfigRepo";
import UserlevelProfileRepo from "../../database/repository/UserLevelProfileRepo";
import { getRandomInt } from "../../utils/calculator";
import { ModuleOn, On, Repository } from "../core/decorators";
import ClientModule from "../core/ClientModule";
import { Collection, Events, GuildMember, VoiceState } from "discord.js";

export interface MemberVoiceSession {
  readonly id: string;
  readonly guildId: string;
  readonly joinTimestamp: number;
  isOpenMic: boolean;
  lastOpenMicTimestamp?: number;
  bonusEpx: number;
}

export enum MemberVoiceEvents {
  MUTE = "voiceMute",
  UNMUTE = "voiceUnmute",
  JOIN = "voiceJoin",
  LEAVE = "voiceLeave",
}

export default class VoiceLevelProvider extends ClientModule<"voice-level-provider"> {
  private readonly cache: Collection<string, GuildLevelProviderProfile> = new Collection();
  private readonly userCache: Collection<string, UserLevelProfile> = new Collection();

  @Repository()
  private readonly guildRepo: GuildLevelProviderProfileRepo;
  @Repository()
  private readonly userRepo: UserlevelProfileRepo;

  private readonly sessions: Collection<string, MemberVoiceSession> = new Collection();

  private classifyState(oldState: VoiceState, newState: VoiceState): MemberVoiceEvents {
    if (oldState.channelId && !newState.channelId) {
      return MemberVoiceEvents.LEAVE;
    } else if (!oldState.channelId && newState.channelId) {
      return MemberVoiceEvents.JOIN;
    } else if (!oldState.mute && newState.mute) {
      return MemberVoiceEvents.MUTE;
    } else {
      return MemberVoiceEvents.UNMUTE;
    }
  }

  private async getGuildProfile(guildId: string): Promise<GuildLevelProviderProfile> {
    let guildProfile = this.cache.get(guildId);
    if (!guildProfile) guildProfile = (await this.guildRepo.get(guildId))!;
    if (!guildProfile) guildProfile = new GuildLevelProviderProfile({ id: guildId });
    return guildProfile;
  }

  private async getUserProfile(member: GuildMember) {
    let userProfile = this.userCache.get(`${member.id}|${member.guild.id}`);
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

  @ModuleOn(MemberVoiceEvents.JOIN)
  private async userJoinVoiceEvent(member: GuildMember) {
    const cacheId = `${member.id}|${member.guild.id}`;
    let session = this.sessions.get(cacheId);
    if (session) return;

    session = {
      id: member.id,
      guildId: member.guild.id,
      joinTimestamp: Date.now(),
      isOpenMic: !member.voice.selfMute,
      bonusEpx: 0,
      lastOpenMicTimestamp: member.voice.mute ? undefined : Date.now(),
    };

    this.sessions.set(cacheId, session);
  }

  @ModuleOn(MemberVoiceEvents.LEAVE)
  private async userLeaveVoiceEvent(member: GuildMember) {
    const userProfile = await this.getUserProfile(member);
    const cacheId = `${member.id}|${member.guild.id}`;
    let session = this.sessions.get(cacheId);
    if (!session) {
      return;
    }

    let expBonus = 0;

    if (session.isOpenMic) {
      expBonus +=
        Math.floor(((Date.now() - (session.lastOpenMicTimestamp ?? Date.now())) / 60000) * 0.5) * getRandomInt(25, 35);
    }

    const expByMinutes = Math.floor(((Date.now() - session.joinTimestamp) / 60000) * 0.5) * getRandomInt(25, 35);

    userProfile.voiceExp += expByMinutes + session.bonusEpx + expBonus;

    this.sessions.delete(cacheId);

    await this.userRepo.updateByVoiceLevel(userProfile);
  }

  @ModuleOn(MemberVoiceEvents.MUTE)
  private async userMuteEvent(member: GuildMember) {
    const cacheId = `${member.id}|${member.guild.id}`;
    let session = this.sessions.get(cacheId);
    if (!session) {
      session = {
        id: member.id,
        guildId: member.guild.id,
        joinTimestamp: Date.now(),
        isOpenMic: member.voice.mute ?? false,
        bonusEpx: 0,
        lastOpenMicTimestamp: member.voice.mute ? undefined : Date.now(),
      };
    }

    if (session.isOpenMic) {
      session.isOpenMic = false;
    }

    const timeByMiliseconds = Date.now() - (session.lastOpenMicTimestamp ?? Date.now());

    const expBonus = Math.floor(((timeByMiliseconds > 0 ? timeByMiliseconds : 0) / 60000) * 0.5) * getRandomInt(25, 35);

    session.bonusEpx += expBonus;
    this.sessions.set(session.id, session);
  }

  @ModuleOn(MemberVoiceEvents.UNMUTE)
  private async userUnmuteEvent(member: GuildMember) {
    const cacheId = `${member.id}|${member.guild.id}`;
    let session = this.sessions.get(cacheId);
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

    this.sessions.set(session.id, session);
  }

  @On(Events.VoiceStateUpdate)
  protected async onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<any> {
    const member = oldState.member || newState.member;
    if (!member || member.user.bot) return;
    const guildProfile = await this.getGuildProfile(member.guild.id);
    if (!guildProfile.active) return;

    const memberEvent = this.classifyState(oldState, newState);

    this.emit(memberEvent, oldState, newState);
  }
}
