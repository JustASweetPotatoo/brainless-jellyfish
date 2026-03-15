export interface UserLevelProfileOptions {
  readonly id: string;
  readonly guildId: string;

  messageExp?: number;
  voiceExp?: number;
  milestoneId?: string;
}

export interface UserLevelProfileJSON {
  readonly id: string;
  readonly guild_id: string;
  message_exp: number;
  voice_exp: number;
  milestone_id: string;
}

export default class UserLevelProfile {
  // Identification
  readonly id: string;
  readonly guildId: string;

  // Statistic
  messageExp: number = 0;
  voiceExp: number = 0;
  milestoneId: string = "";

  constructor(options: UserLevelProfileOptions) {
    this.id = options.id;
    this.guildId = options.guildId;
    this.messageExp = options.messageExp ?? 0;
    this.voiceExp = options.voiceExp ?? 0;
    this.milestoneId = options.milestoneId ?? "";
  }

  static toThis(options: UserLevelProfileJSON) {
    return new UserLevelProfile({
      id: options.id,
      guildId: options.guild_id,
      messageExp: options.message_exp,
      voiceExp: options.voice_exp,
      milestoneId: options.milestone_id,
    });
  }

  toJSON(): UserLevelProfileJSON {
    return {
      id: this.id,
      guild_id: this.guildId,
      message_exp: this.messageExp,
      voice_exp: this.voiceExp,
      milestone_id: this.milestoneId,
    };
  }
}
