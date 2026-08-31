import { BaseModel } from "../constructor/BaseModel";

export interface GuildVoiceLoggerConfigJson {
  readonly id: string;
  channel_id?: string | null;
  active: boolean;
}

export default class GuildVoiceLoggerConfig extends BaseModel<GuildVoiceLoggerConfigJson> {
  readonly id: string;
  channelId: string | null | undefined;
  active: boolean;

  constructor(json: GuildVoiceLoggerConfigJson) {
    super();

    this.id = json.id;
    this.channelId = json.channel_id;
    this.active = json.active;
  }

  getChannelCacheId = (): string => `${this.id}|${this.channelId}`;

  toJSON(): GuildVoiceLoggerConfigJson {
    return {
      id: this.id,
      channel_id: this.channelId,
      active: this.active,
    };
  }
}
