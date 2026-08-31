import { BaseModel } from "./constructor/BaseModel";

export interface RankProviderMilestoneObj {
  readonly id: string;
  readonly guild_id: string;
  role_id?: string;
  start_at: number;
  end_at: number;
}

export default class RankProviderMilestone extends BaseModel<RankProviderMilestoneObj> {
  readonly id: string;
  readonly guildId: string;
  roleId?: string;
  startAt: number;
  endAt: number;

  constructor(json: RankProviderMilestoneObj) {
    super();

    this.id = json.id;
    this.guildId = json.guild_id;
    this.roleId = json.role_id;
    this.startAt = json.start_at;
    this.endAt = json.end_at;
  }

  toJSON(): RankProviderMilestoneObj {
    return {
      id: this.id,
      guild_id: this.guildId,
      role_id: this.roleId,
      start_at: this.startAt,
      end_at: this.endAt,
    };
  }
}
