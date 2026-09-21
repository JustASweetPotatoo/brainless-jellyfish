import { Collection } from "discord.js";
import { BaseModel } from "./constructor/BaseModel";
import { getDayTimestamp } from "../../utils/timestamps";

export interface GuildMessageStatsJson {
  readonly guild_id: string;
  readonly day_timestamp: number;
  stats_map_json: GuildMessageStatsInHoursJson[];
}

export interface GuildMessageStatsOptions {
  readonly guildId: string;
  readonly dayTimestamp?: number;
}

export interface GuildMessageStatsInHours {
  readonly guildId: string;
  readonly timestampHours: number;
  userStatMap: Map<string, number>;
  channelStatMap: Map<string, number>;
  userLeaderBoard: Array<{ userId: string; rank: number }>;
  channelLeaderBoard: Array<{ channelId: string; rank: number }>;
}

export interface GuildMessageStatsInHoursJson {
  readonly guildId: string;
  readonly timestampHours: number;
  userStatMap: Record<string, number>;
  channelStatMap: Record<string, number>;
  userLeaderBoard: Array<{ userId: string; rank: number }>;
  channelLeaderBoard: Array<{ channelId: string; rank: number }>;
}

export default class GuildMessageStats extends BaseModel<GuildMessageStatsJson> {
  readonly guildId: string;
  readonly dayTimestamp: number;
  readonly statMapByHour: Collection<number, GuildMessageStatsInHours> = new Collection();

  constructor(options: GuildMessageStatsOptions) {
    super();
    this.guildId = options.guildId;
    this.dayTimestamp = options.dayTimestamp ?? getDayTimestamp();
  }

  update(statInHour: GuildMessageStatsInHours) {
    this.statMapByHour.set(statInHour.timestampHours, statInHour);
  }

  static fromDatabaseJSON(json: GuildMessageStatsJson): GuildMessageStats {
    const stats = new GuildMessageStats({
      guildId: json.guild_id,
      dayTimestamp: json.day_timestamp,
    });

    for (const stat of json.stats_map_json ?? []) {
      stats.update({
        guildId: stat.guildId,
        timestampHours: stat.timestampHours,
        userStatMap: new Map(Object.entries(stat.userStatMap ?? {})),
        channelStatMap: new Map(Object.entries(stat.channelStatMap ?? {})),
        userLeaderBoard: stat.userLeaderBoard ?? [],
        channelLeaderBoard: stat.channelLeaderBoard ?? [],
      });
    }

    return stats;
  }

  toJSON(): GuildMessageStatsJson {
    return {
      guild_id: this.guildId,
      day_timestamp: this.dayTimestamp,
      stats_map_json: this.statMapByHour.map((stat) => ({
        guildId: stat.guildId,
        timestampHours: stat.timestampHours,
        userStatMap: Object.fromEntries(stat.userStatMap),
        channelStatMap: Object.fromEntries(stat.channelStatMap),
        userLeaderBoard: stat.userLeaderBoard,
        channelLeaderBoard: stat.channelLeaderBoard,
      })),
    };
  }
}
