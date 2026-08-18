import DatabaseManager from "../../DatabaseManager";
import GuildVoiceLoggerConfig, {
  GuildVoiceLoggerConfigJson,
} from "../../model/logger/GuildVoiceLoggerConfig";
import { Repository } from "../constructor/Repository";

export default class GuildVoiceLoggerConfigRepo extends Repository<
  GuildVoiceLoggerConfig,
  GuildVoiceLoggerConfigJson
> {
  protected readonly model = GuildVoiceLoggerConfig;

  protected readonly createTableQuery = `
  CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
    id VARCHAR(32) PRIMARY KEY,
    channel_id VARCHAR(32),
    active BOOLEAN NOT NULL
  )
  `;

  constructor(database: DatabaseManager) {
    super("guild_voice_logger_config", database);
  }

  async create(data: GuildVoiceLoggerConfig): Promise<GuildVoiceLoggerConfig> {
    const json = data.toJSON();

    await this.executeQuery(
      `INSERT INTO ${this.fullTableName} (id, channel_id, active)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY
       UPDATE channel_id = ?, active = ?;`,
      [json.id, json.channel_id, json.active, json.channel_id, json.active],
    );

    return data;
  }

  async update(data: GuildVoiceLoggerConfig): Promise<GuildVoiceLoggerConfig> {
    const json = data.toJSON();

    await this.executeQuery(
      `UPDATE ${this.fullTableName}
       SET channel_id = ?, active = ?
       WHERE id = ?`,
      [json.channel_id, json.active, json.id],
    );

    return data;
  }

  async delete(id: string): Promise<boolean> {
    await this.executeQuery(`DELETE FROM ${this.fullTableName} WHERE id = ?`, [id]);

    return true;
  }

  async get(options: { id: string; autoCreate?: boolean }): Promise<GuildVoiceLoggerConfig>;

  async get(options: {
    id: string;
    autoCreate?: boolean;
  }): Promise<GuildVoiceLoggerConfig | undefined>;

  async get(options: {
    id: string;
    autoCreate?: boolean;
  }): Promise<GuildVoiceLoggerConfig | undefined> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.fullTableName} WHERE id = ? LIMIT 1;`,
      [options.id],
    );

    if (options.autoCreate && rows.length == 0) {
      const newProf = new GuildVoiceLoggerConfig({ id: options.id, active: true });
      return await this.create(newProf);
    }

    return this.model.fromJSON(rows[0] as GuildVoiceLoggerConfigJson);
  }
}
