import { BaseModel } from "../constructor/BaseModel";

export interface GuildServerLoggerConfigJson {
  readonly id: string;
  channel_id?: string | null;
  active: boolean;
}

export default class GuildServerLoggerConfig extends BaseModel<GuildServerLoggerConfigJson> {
  readonly id: string;
  channelId: string | null | undefined;
  active: boolean;

  constructor(json: GuildServerLoggerConfigJson) {
    super(json);

    this.id = json.id;
    this.channelId = json.channel_id;
    this.active = json.active;
  }

  toJSON(): GuildServerLoggerConfigJson {
    return {
      id: this.id,
      channel_id: this.channelId,
      active: this.active,
    };
  }
}
