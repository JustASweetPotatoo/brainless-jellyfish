import { BucketCounter } from "../../modules/MessageStats";
import { parseCompositeKey } from "../../utils/redisUtils";
import { getDayTimestamp, getHourTimestamp } from "../../utils/timestamps";
import DatabaseManager from "../DatabaseManager";
import GuildMessageStats, { GuildMessageStatsJson } from "../model/GuildMessageStats";
import GuildStatistics, {
  GuildStatisticsIncrementType as GuildMessageStatIncrementType,
} from "../model/GuildStatistics";
import { Repository } from "./constructor/Repository";

export default class GuildMessageStatRepo extends Repository<
  GuildMessageStats,
  GuildMessageStatsJson
> {
  protected readonly model = GuildStatistics;

  protected readonly createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
      guild_id VARCHAR(64) NOT NULL PRIMARY KEY,
      day_timestamp VARCHAR(64) NOT NULL PRIMARY KEY,
      stat_map JSON
    );
  `;

  constructor(database: DatabaseManager) {
    super("guild_statistics", database);
  }

  async get(options: { guildId: string; dayTimestamp: number }): Promise<GuildMessageStats> {
    const row = (
      await this.executeQuery(
        `
        SELECT * FROM ${this.fullTableName}
        WHERE guild_id = ? AND day_timestamp = ?
        LIMIT 1;
      `,
        [options.guildId, options.dayTimestamp],
      )
    ).at(0);

    if (row) {
      return GuildMessageStats.fromDatabaseJSON({
        guild_id: row.guild_id,
        day_timestamp: row.day_timestamp,
        stats_map_json: typeof row.stat_map === "string" ? JSON.parse(row.stat_map) : row.stat_map,
      });
    }

    return await this.create(
      new GuildMessageStats({ guildId: options.guildId, dayTimestamp: getDayTimestamp() }),
    );
  }

  async create(data: GuildMessageStats): Promise<GuildMessageStats> {
    const json = data.toJSON();
    await this.executeQuery(
      `
      INSERT INTO ${this.fullTableName}
        (guild_id, day_timestamp, stat_map)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE day_timestamp = ?, stat_map = ?
      ;
    `,
      [
        json.guild_id,
        json.day_timestamp,
        JSON.stringify(json.stats_map_json),
        json.day_timestamp,
        JSON.stringify(json.stats_map_json),
      ],
    );

    return data;
  }

  async update(data: GuildMessageStats): Promise<GuildMessageStats> {
    const json = data.toJSON();
    await this.executeQuery(
      `
      UPDATE ${this.fullTableName}
      SET stat_map = ?
      WHERE guild_id = ? AND day_timestamp = ?;
    `,
      [JSON.stringify(json.stats_map_json), json.guild_id, json.day_timestamp],
    );

    return data;
  }

  // async increment(
  //   id: string,
  //   type: GuildMessageStatIncrementType,
  //   statistic?: GuildMessageStats,
  // ): Promise<void> {
  //   const dayTimestamp = getDayTimestamp(new Date().getTime());
  //   if (!statistic) statistic = await this.get({ guildId: id, dayTimestamp: dayTimestamp });
  //   if (!statistic) statistic = await this.create(new GuildMessageStats({ guildId: id }));
  //   await this.update(statistic);
  // }

  async flush(queue: Map<number, BucketCounter>) {
    const guildStatsMap = new Map<string, GuildMessageStats>();

    for (const [hourTimestamp, bucketCounter] of queue) {
      const guildIds = new Set<string>();

      for (const [guildId] of bucketCounter.guild) {
        guildIds.add(guildId);
      }

      for (const [compositeKey] of bucketCounter.guildUser) {
        const [guildId] = parseCompositeKey(compositeKey);
        guildIds.add(guildId);
      }

      for (const [compositeKey] of bucketCounter.guildChannel) {
        const [guildId] = parseCompositeKey(compositeKey);
        guildIds.add(guildId);
      }

      for (const guildId of guildIds) {
        const dayTimestamp = getDayTimestamp(hourTimestamp);
        const guildKey = `${guildId}:${dayTimestamp}`;

        let stats = guildStatsMap.get(guildKey);
        if (!stats) {
          stats = new GuildMessageStats({ guildId, dayTimestamp });
          guildStatsMap.set(guildKey, stats);
        }

        let hourStat = stats.statMapByHour.get(hourTimestamp);
        if (!hourStat) {
          hourStat = {
            guildId,
            timestampHours: hourTimestamp,
            userStatMap: new Map<string, number>(),
            channelStatMap: new Map<string, number>(),
            userLeaderBoard: [],
            channelLeaderBoard: [],
          };
          stats.update(hourStat);
        }

        for (const [compositeKey, count] of bucketCounter.guildUser) {
          const [guildKeyId, userId] = parseCompositeKey(compositeKey);
          if (guildKeyId !== guildId) continue;

          hourStat.userStatMap.set(userId, (hourStat.userStatMap.get(userId) ?? 0) + count);
        }

        for (const [compositeKey, count] of bucketCounter.guildChannel) {
          const [guildKeyId, channelId] = parseCompositeKey(compositeKey);
          if (guildKeyId !== guildId) continue;

          hourStat.channelStatMap.set(
            channelId,
            (hourStat.channelStatMap.get(channelId) ?? 0) + count,
          );
        }

        hourStat.userLeaderBoard = [...hourStat.userStatMap.entries()]
          .sort(([, a], [, b]) => b - a)
          .map(([userId], index) => ({ userId, rank: index + 1 }));

        hourStat.channelLeaderBoard = [...hourStat.channelStatMap.entries()]
          .sort(([, a], [, b]) => b - a)
          .map(([channelId], index) => ({ channelId, rank: index + 1 }));
      }
    }

    for (const stats of guildStatsMap.values()) {
      await this.create(stats);
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.executeQuery(`DELETE FROM ${this.fullTableName} WHERE id = ?`, [id]);
    return true;
  }
}
