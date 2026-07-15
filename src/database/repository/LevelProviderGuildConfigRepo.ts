import DatabaseManager from "../DatabaseManager";
import LevelProviderGuildProfile, {
  LevelProviderGuildProfileJson,
} from "../model/RankProviderGuildProfile";
import { Repository } from "./constructor/Repository";

export default class LevelProviderGuildConfigRepo extends Repository<
  LevelProviderGuildProfile,
  LevelProviderGuildProfileJson
> {
  protected readonly model = LevelProviderGuildProfile;

  protected readonly createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
      id VARCHAR(64) PRIMARY KEY,
      active BOOLEAN NOT NULL DEFAULT false,
      log_channel_id VARCHAR(64),
      rate DOUBLE DEFAULT 1,
      milestones JSON
    );
  `;

  constructor(database: DatabaseManager) {
    super("level_guild_config", database);
  }

  async create(
    data: LevelProviderGuildProfile,
  ): Promise<LevelProviderGuildProfile> {
    const json = data.toJSON();

    const query = `
      INSERT INTO ${this.fullTableName}
        (id, active, log_channel_id, rate, milestones)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
      json.id,
      json.active,
      json.log_channel_id,
      json.rate,
      JSON.stringify(json.milestones),
    ];

    await this.executeQuery(query, values);

    return data;
  }

  async update(
    data: LevelProviderGuildProfile,
  ): Promise<LevelProviderGuildProfile> {
    const json = data.toJSON();

    const query = `
      UPDATE ${this.fullTableName}
      SET
        active = ?,
        log_channel_id = ?,
        rate = ?,
        milestones = ?
      WHERE id = ?
    `;

    await this.executeQuery(query, [
      json.active,
      json.log_channel_id,
      json.rate,
      JSON.stringify(json.milestones),
      json.id,
    ]);

    return data;
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.fullTableName} WHERE id = ?`;

    await this.executeQuery(query, [id]);

    return true;
  }

  async get(id: string): Promise<LevelProviderGuildProfile | null> {
    const query = `SELECT * FROM ${this.fullTableName} WHERE id = ? LIMIT 1`;

    const row = (await this.executeQuery(query, [id])).at(0);

    if (!row) return null;

    return this.model.fromJSON({
      id: row.id,
      active: !!row.active,
      log_channel_id: row.log_channel_id,
      rate: row.rate,
      milestones: row.milestones ?? [],
    });
  }
}
