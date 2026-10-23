import { calcLevel, getTotalExpToReachLevel } from "../../utils/calculator";
import { BaseModel } from "./constructor/BaseModel";

export interface UserLevelProfileJson {
  readonly id: string;
  readonly guild_id: string;
  text_exp?: number;
  voice_exp?: number;
  milestone_id?: string;
  channel_blacklist?: string[];
}

export default class UserLevelProfile extends BaseModel<UserLevelProfileJson> {
  // Identification
  readonly id: string;
  readonly guildId: string;

  // Statistic
  textExp: number = 0;
  voiceExp: number = 0;
  milestoneId: string = "";

  cacheCount: number = 0;

  // Blacklisting
  channelBlacklist: string[];

  constructor(options: UserLevelProfileJson) {
    super();

    this.id = options.id;
    this.guildId = options.guild_id;
    this.textExp = options.text_exp ?? 0;
    this.voiceExp = options.voice_exp ?? 0;
    this.milestoneId = options.milestone_id ?? "";
    this.channelBlacklist = options.channel_blacklist ?? [];
  }

  static toThis(options: UserLevelProfileJson) {
    return new UserLevelProfile({
      id: options.id,
      guild_id: options.guild_id,
      text_exp: options.text_exp,
      voice_exp: options.voice_exp,
      milestone_id: options.milestone_id,
      channel_blacklist: options.channel_blacklist,
    });
  }

  toJSON(): UserLevelProfileJson {
    return {
      id: this.id,
      guild_id: this.guildId,
      text_exp: this.textExp,
      voice_exp: this.voiceExp,
      milestone_id: this.milestoneId,
      channel_blacklist: this.channelBlacklist,
    };
  }

  getVoiceLevel() {
    return calcLevel(this.voiceExp);
  }

  getMessageLevel() {
    return calcLevel(this.textExp);
  }

  getCacheId() {
    return this.id + "|" + this.guildId;
  }

  addLevel(typeText: boolean, amount: number) {
    let newLevel = calcLevel(typeText ? this.textExp : this.voiceExp) + amount;
    if (newLevel < 0) newLevel = 0;

    if (typeText) {
      this.textExp = getTotalExpToReachLevel(newLevel);
      return newLevel;
    } else {
      this.voiceExp = getTotalExpToReachLevel(newLevel);
      return newLevel;
    }
  }

  addExp(typeText: boolean, amount: number) {
    if (typeText) {
      this.textExp = amount;
      return this.textExp;
    } else {
      this.voiceExp = amount;
      return this.voiceExp;
    }
  }
}
