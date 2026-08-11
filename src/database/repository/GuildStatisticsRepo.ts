import DatabaseManager from "../DatabaseManager";
import GuildStatistics, { GuildStatisticsJson } from "../model/GuildStatistics";
import { Repository } from "./constructor/Repository";

export default class GuildStatisticsRepo extends Repository<GuildStatistics, GuildStatisticsJson> {
  protected readonly model = GuildStatistics;

  protected readonly createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
      id VARCHAR(64) PRIMARY KEY,
      message_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
      member_join_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
      member_leave_count BIGINT UNSIGNED NOT NULL DEFAULT 0
    );
  `;

  constructor(database: DatabaseManager) {
    super("guild_statistics", database);
  }

  async get(id: string): Promise<GuildStatistics> {
    const row = (
      await this.executeQuery(
        `
      SELECT * FROM ${this.fullTableName}
      WHERE id = ?
      LIMIT 1;
    `,
        [id],
      )
    ).at(0);

    if (row) return this.model.fromJSON(row as GuildStatisticsJson);
    return this.create(new GuildStatistics({ id }));
  }

  async create(data: GuildStatistics): Promise<GuildStatistics> {
    const json = data.toJSON();
    await this.executeQuery(
      `
      INSERT INTO ${this.fullTableName}
        (id, message_count, member_join_count, member_leave_count)
      VALUES (?, ?, ?, ?);
    `,
      [json.id, json.message_count, json.member_join_count, json.member_leave_count],
    );

    return data;
  }

  async update(data: GuildStatistics): Promise<GuildStatistics> {
    const json = data.toJSON();
    await this.executeQuery(
      `
      UPDATE ${this.fullTableName}
      SET message_count = ?, member_join_count = ?, member_leave_count = ?
      WHERE id = ?;
    `,
      [json.message_count, json.member_join_count, json.member_leave_count, json.id],
    );

    return data;
  }

  async increment(id: string, column: "message_count" | "member_join_count" | "member_leave_count"): Promise<void> {
    await this.executeQuery(
      `
      INSERT INTO ${this.fullTableName} (id, ${column})
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE ${column} = ${column} + 1;
    `,
      [id],
    );
  }

  async delete(id: string): Promise<boolean> {
    await this.executeQuery(`DELETE FROM ${this.fullTableName} WHERE id = ?`, [id]);
    return true;
  }
}
