import { BaseModel } from "../constructor/BaseModel";

export interface GuildUserJoinLoggerConfigJson {
  readonly id: string;
  channel_id?: string | null;
  active: boolean;
}

export default class GuildUserJoinLoggerConfig extends BaseModel<GuildUserJoinLoggerConfigJson> {
  readonly id: string;
  channelId: string | null | undefined;
  active: boolean;

  constructor(json: GuildUserJoinLoggerConfigJson) {
    super(json);

    this.id = json.id;
    this.channelId = json.channel_id;
    this.active = json.active;
  }

  toJSON(): GuildUserJoinLoggerConfigJson {
    return {
      id: this.id,
      channel_id: this.channelId,
      active: this.active,
    };
  }
}
