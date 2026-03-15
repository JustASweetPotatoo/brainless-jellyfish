import { Colors } from "discord.js";
import Model, { ModelJSON, ModelOptions } from "./Model";

export interface GuildLevelCheckpointOptions extends ModelOptions {
  readonly guildId: string;
  readonly roleId: string;
  startLevel: number;
  endLevel: number;
  color: (typeof Colors)[keyof typeof Colors];
}

export interface GuildLevelCheckpointJSON extends ModelJSON {
  readonly guild_id: string;
  readonly role_id: string;
  start_level: number;
  end_level: number;
  color: (typeof Colors)[keyof typeof Colors];
}

export default class GuildLevelCheckpoint
  implements Model<GuildLevelCheckpointOptions, GuildLevelCheckpointJSON>
{
  readonly guildId: string;
  readonly roleId: string;
  startLevel: number;
  endLevel: number;
  color: (typeof Colors)[keyof typeof Colors];

  readonly createTimestamp: Date;

  constructor(options: GuildLevelCheckpointOptions) {
    this.guildId = options.guildId;
    this.roleId = options.roleId;
    this.startLevel = options.startLevel;
    this.endLevel = options.endLevel;
    this.color = options.color;
  }

  toJSON(): GuildLevelCheckpointJSON {
    return {
      create_timestamp: this.createTimestamp,
      guild_id: this.guildId,
      role_id: this.roleId,
      start_level: this.startLevel,
      end_level: this.endLevel,
      color: this.color,
    };
  }

  static rowConvert(row: any): GuildLevelCheckpoint {
    return new GuildLevelCheckpoint({
      guildId: row.guild_id,
      roleId: row.role_id,
      startLevel: row.start_level,
      endLevel: row.end_level,
      createTimestamp: row.create_timestamp,
      color: row.color,
    });
  }
}
