export interface UserLevelProfileJSON {
  readonly id: string;
  readonly guild_id: string;
  level: number;
  exp: number;
  message_count: number;
  role_achivement_id: string;
  ranking_type: "tutien" | "normal";
}

export interface UserLevelProfileCreateOptions {
  readonly id: string;
  readonly guildId: string;

  exp?: number;
  level?: number;
  messageCount?: number;
  roleAchivementId?: string;
  rankingType?: "tutien" | "normal";
}

export default class UserLevelProfile {
  public readonly id: string;
  public readonly guildId: string;

  public exp: number;
  public level: number;
  public messageCount: number = 0;
  public roleAchivementId: string | undefined;
  public guildCheckpointRoleId: string | undefined;
  public rankingType: "tutien" | "normal";

  constructor(options: UserLevelProfileCreateOptions) {
    this.id = options.id;
    this.guildId = options.guildId;
    this.exp = options.exp ?? 0;
    this.level = options.level ?? 0;
    this.messageCount = options.messageCount ?? 0;
    this.roleAchivementId = options.roleAchivementId ?? undefined;
    this.rankingType = options.rankingType ?? "tutien";
  }

  static rowConvert(data: UserLevelProfileJSON) {
    return new UserLevelProfile({
      id: data.id,
      guildId: data.guild_id,
      exp: data.exp,
      level: data.level,
      messageCount: data.message_count,
      roleAchivementId: data.role_achivement_id,
      rankingType: data.ranking_type,
    });
  }

  toJSON(): UserLevelProfileJSON {
    return {
      id: this.id,
      guild_id: this.guildId,
      exp: this.exp,
      level: this.level,
      role_achivement_id: this.roleAchivementId ?? "",
      ranking_type: this.rankingType,
      message_count: this.messageCount,
    };
  }
}
