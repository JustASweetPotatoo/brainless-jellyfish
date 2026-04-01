import { Repository } from "../repository/constructor/Repository";
import { BaseModel } from "./constructor/BaseModel";

export interface UserLevelProfileJson {
  readonly id: string;
  readonly guild_id: string;
  message_exp: number;
  voice_exp: number;
  milestone_id: string;
}

export default class UserLevelProfile extends BaseModel<UserLevelProfileJson> {
  // Identification
  readonly id: string;
  readonly guildId: string;

  // Statistic
  messageExp: number = 0;
  voiceExp: number = 0;
  milestoneId: string = "";

  cacheCount: number = 0;

  constructor(options: UserLevelProfileJson) {
    super(options);

    this.id = options.id;
    this.guildId = options.guild_id;
    this.messageExp = options.message_exp ?? 0;
    this.voiceExp = options.voice_exp ?? 0;
    this.milestoneId = options.milestone_id ?? "";
  }

  static toThis(options: UserLevelProfileJson) {
    return new UserLevelProfile({
      id: options.id,
      guild_id: options.guild_id,
      message_exp: options.message_exp,
      voice_exp: options.voice_exp,
      milestone_id: options.milestone_id,
    });
  }

  toJSON(): UserLevelProfileJson {
    return {
      id: this.id,
      guild_id: this.guildId,
      message_exp: this.messageExp,
      voice_exp: this.voiceExp,
      milestone_id: this.milestoneId,
    };
  }
}
