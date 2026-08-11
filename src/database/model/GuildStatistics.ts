import { BaseModel } from "./constructor/BaseModel";

export interface GuildStatisticsJson {
  readonly id: string;
  message_count?: number;
  member_join_count?: number;
  member_leave_count?: number;
}

export default class GuildStatistics extends BaseModel<GuildStatisticsJson> {
  readonly id: string;
  messageCount: number;
  memberJoinCount: number;
  memberLeaveCount: number;

  constructor(options: GuildStatisticsJson) {
    super(options);

    this.id = options.id;
    this.messageCount = Number(options.message_count ?? 0);
    this.memberJoinCount = Number(options.member_join_count ?? 0);
    this.memberLeaveCount = Number(options.member_leave_count ?? 0);
  }

  toJSON(): GuildStatisticsJson {
    return {
      id: this.id,
      message_count: this.messageCount,
      member_join_count: this.memberJoinCount,
      member_leave_count: this.memberLeaveCount,
    };
  }
}
