import { BaseModel } from "../constructor/BaseModel";

export interface GuildMessageLoggerConfigJson {
  readonly id: string;
  channel_id?: string | null;
  active: boolean;
}

export default class GuildMessageLoggerConfig extends BaseModel<GuildMessageLoggerConfigJson> {
  readonly id: string;
  channelId: string | null | undefined;
  active: boolean;

  constructor(json: GuildMessageLoggerConfigJson) {
    super(json);

    this.id = json.id;
    this.channelId = json.channel_id;
    this.active = json.active;
  }

  toJSON(): GuildMessageLoggerConfigJson {
    return {
      id: this.id,
      channel_id: this.channelId,
      active: this.active,
    };
  }
}
