import { BaseModel } from "../constructor/BaseModel";

export interface GuildUserLoggerConfigJson {
  readonly id: string;
  channel_id?: string | null;
  active: boolean;
}

export default class GuildUserLoggerConfig extends BaseModel<GuildUserLoggerConfigJson> {
  readonly id: string;
  channelId: string | null | undefined;
  active: boolean;

  constructor(json: GuildUserLoggerConfigJson) {
    super();

    this.id = json.id;
    this.channelId = json.channel_id;
    this.active = json.active;
  }

  toJSON(): GuildUserLoggerConfigJson {
    return {
      id: this.id,
      channel_id: this.channelId,
      active: this.active,
    };
  }
}
