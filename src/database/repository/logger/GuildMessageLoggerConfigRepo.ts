import DatabaseManager from "../../DatabaseManager";
import GuildMessageLoggerConfig, {
  GuildMessageLoggerConfigJson,
} from "../../model/logger/GuildMessageLoggerConfig";
import { Repository } from "../constructor/Repository";

export default class GuildMessageLoggerConfigRepo extends Repository<
  GuildMessageLoggerConfig,
  GuildMessageLoggerConfigJson
> {
  protected readonly model = GuildMessageLoggerConfig;

  protected readonly createTableQuery = `
  CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
    id VARCHAR(32) PRIMARY KEY,
    channel_id VARCHAR(32),
    active BOOLEAN NOT NULL
  )
  `;

  constructor(database: DatabaseManager) {
    super("guild_message_logger_config", database);
  }

  async create(data: GuildMessageLoggerConfig): Promise<GuildMessageLoggerConfig> {
    const json = data.toJSON();

    await this.executeQuery(
      `INSERT INTO ${this.fullTableName} (id, channel_id, active)
       VALUES (?, ?, ?)`,
      [json.id, json.channel_id, json.active]
    );

    return data;
  }

  async update(data: GuildMessageLoggerConfig): Promise<GuildMessageLoggerConfig> {
    const json = data.toJSON();

    await this.executeQuery(
      `UPDATE ${this.fullTableName}
       SET channel_id = ?, active = ?
       WHERE id = ?`,
      [json.channel_id, json.active, json.id]
    );

    return data;
  }

  async delete(id: string): Promise<boolean> {
    await this.executeQuery(`DELETE FROM ${this.fullTableName} WHERE id = ?`, [id]);

    return true;
  }

  async get(id: string): Promise<GuildMessageLoggerConfig | null> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.fullTableName} WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows.length) return null;

    return this.model.fromJSON(rows[0] as GuildMessageLoggerConfigJson);
  }
}
