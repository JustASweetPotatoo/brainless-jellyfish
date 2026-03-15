import { Collection } from "discord.js";
import Model, { ModelJSON, ModelOptions } from "./Model";
import GuildLevelCheckpoint from "./GuildLevelCheckPoint";

export interface GuildLevelSystemProfileConstructorOptions extends ModelOptions {
  readonly id: string;
  readonly createTimestamp?: Date;
  activate: boolean;
  logChannel?: string;
}

export interface GuildLevelSystemProfileJSON extends ModelJSON {
  readonly id: string;
  readonly create_timestamp: Date;
  log_channel_id?: string;
  activate: boolean;
}

export default class GuildLevelSystemProfile
  implements
    Model<GuildLevelSystemProfileConstructorOptions, GuildLevelSystemProfileJSON>
{
  readonly id: string;
  readonly createTimestamp: Date;
  activate: boolean;
  logChannelId?: string;
  checkpointCollection: Collection<string, GuildLevelCheckpoint>;

  constructor(options: GuildLevelSystemProfileConstructorOptions) {
    this.id = options.id;
    this.createTimestamp = options.createTimestamp ?? new Date();
    this.logChannelId = options.logChannel;
    this.activate = options.activate;
  }

  toJSON(): GuildLevelSystemProfileJSON {
    return {
      id: this.id,
      create_timestamp: this.createTimestamp,
      log_channel_id: undefined,
      activate: this.activate,
    };
  }

  static rowConvert(row: any): GuildLevelSystemProfile {
    return new GuildLevelSystemProfile({
      id: row.id,
      createTimestamp: row.create_timestamp,
      logChannel: row.log_channel_id,
      activate: row.activate,
    });
  }
}
