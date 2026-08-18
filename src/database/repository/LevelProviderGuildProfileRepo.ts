import DatabaseManager from "../DatabaseManager";
import LevelProviderGuildProfile, { RankProviderGuildProfileJson } from "../model/RankProviderGuildProfile";
import { Repository } from "./constructor/Repository";

export default class LevelProviderGuildProfileRepo extends Repository<
  LevelProviderGuildProfile,
  RankProviderGuildProfileJson
> {
  protected readonly model = LevelProviderGuildProfile;

  protected readonly createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
      id VARCHAR(64) PRIMARY KEY,
      active BOOLEAN NOT NULL DEFAULT false,
      log_channel_id VARCHAR(64),
      rate DOUBLE DEFAULT 1,
      type TINYINT DEFAULT 1,
      milestones JSON,
      blacklist JSON
    );
  `;

  constructor(database: DatabaseManager) {
    super("level_guild_config", database);
  }

  async create(data: LevelProviderGuildProfile): Promise<LevelProviderGuildProfile> {
    const json = data.toJSON();

    const query = `
      INSERT INTO ${this.fullTableName}
        (id, active, log_channel_id, rate, type, milestones, blacklist)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      json.id,
      json.active,
      json.log_channel_id,
      json.rate,
      json.type,
      JSON.stringify(json.milestones),
      JSON.stringify(json.blacklist),
    ];

    await this.executeQuery(query, values);

    return data;
  }

  async update(data: LevelProviderGuildProfile): Promise<LevelProviderGuildProfile> {
    const json = data.toJSON();

    const query = `
      UPDATE ${this.fullTableName}
      SET
        active = ?,
        log_channel_id = ?,
        rate = ?,
        type = ?,
        milestones = ?,
        blacklist = ?
      WHERE id = ?
    `;

    await this.executeQuery(query, [
      json.active,
      json.log_channel_id,
      json.rate,
      json.type,
      JSON.stringify(json.milestones),
      JSON.stringify(json.blacklist ?? []),
      json.id,
    ]);

    return data;
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.fullTableName} WHERE id = ?`;

    await this.executeQuery(query, [id]);

    return true;
  }

  async get(id: string): Promise<LevelProviderGuildProfile> {
    const query = `SELECT * FROM ${this.fullTableName} WHERE id = ? LIMIT 1`;

    const row = (await this.executeQuery(query, [id])).at(0);

    if (!row) {
      const newProf = new LevelProviderGuildProfile({ id: id });
      await this.create(newProf);
      return newProf;
    }

    const parsedBlacklist = typeof row.blacklist === "string" ? JSON.parse(row.blacklist) : (row.blacklist ?? []);

    return this.model.fromJSON({
      id: row.id,
      active: !!row.active,
      log_channel_id: row.log_channel_id,
      rate: row.rate,
      type: row.type,
      milestones: row.milestones ?? [],
      blacklist: parsedBlacklist,
    });
  }
}
