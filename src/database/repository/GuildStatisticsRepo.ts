import DatabaseManager from "../DatabaseManager";
import GuildStatistics, {
  GuildStatisticsIncrementType,
  GuildStatisticsJson,
} from "../model/GuildStatistics";
import { Repository } from "./constructor/Repository";

export default class GuildStatisticsRepo extends Repository<GuildStatistics, GuildStatisticsJson> {
  protected readonly model = GuildStatistics;

  protected readonly createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      timestamp_by_days VARCHAR(64) NOT NULL,
      count_map JSON,
    );
  `;

  constructor(database: DatabaseManager) {
    super("guild_statistics", database);
  }

  async get(options: { id: string; timestampByDays: string }): Promise<GuildStatistics> {
    const row = (
      await this.executeQuery(
        `
        SELECT * FROM ${this.fullTableName}
        WHERE id = ? AND timestamp_by_days = ?
        LIMIT 1;
      `,
        [options.id, options.timestampByDays],
      )
    ).at(0);

    if (row) return this.model.fromJSON(row as GuildStatisticsJson);
    return this.create(new GuildStatistics({ id: options.id }));
  }

  async create(data: GuildStatistics): Promise<GuildStatistics> {
    const json = data.toJSON();
    await this.executeQuery(
      `
      INSERT INTO ${this.fullTableName}
        (id, timestamp_by_days, count_map)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE timestamp_by_days = ?
      ;
    `,
      [json.id, json.timestamp_by_days, JSON.stringify(json.count_map), json.timestamp_by_days],
    );

    return data;
  }

  async update(data: GuildStatistics): Promise<GuildStatistics> {
    const json = data.toJSON();
    await this.executeQuery(
      `
      UPDATE ${this.fullTableName}
      SET count_map = ?
      WHERE id = ? AND timestamp_by_days = ?;
    `,
      [JSON.stringify(json.count_map), json.id, json.timestamp_by_days],
    );

    return data;
  }

  async increment(
    id: string,
    type: GuildStatisticsIncrementType,
    statistic?: GuildStatistics,
  ): Promise<void> {
    const timestampByDays = Math.floor(new Date().getTime() / 1000 / 60 / 24).toString();
    if (!statistic) statistic = await this.get({ id: id, timestampByDays: timestampByDays });
    if (!statistic) statistic = await this.create(new GuildStatistics({ id: id }));
    statistic.incement(type);
    await this.update(statistic);
  }

  async delete(id: string): Promise<boolean> {
    await this.executeQuery(`DELETE FROM ${this.fullTableName} WHERE id = ?`, [id]);
    return true;
  }
}
