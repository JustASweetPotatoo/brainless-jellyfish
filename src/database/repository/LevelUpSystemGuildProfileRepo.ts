import DatabaseManager from "../DatabaseManager";
import { LevelUpSystemGuildProfileJSON } from "../model/LevelUpSystemGuildProfile";
import { Repository } from "./constructor/Repository";

export default class LevelUpSystemGuildProfileRepo extends Repository {
  constructor(database: DatabaseManager) {
    super("level_up_guild_profile", database);
  }

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ?
      (
        id VARCHAR(64) PRIMARY KEY NOT NULL,
        \`activate\` TINYINT NOT NULL DEFAULT 0,
        log_channel_id VARCHAR(64),
        rate LONGINT NOT NULL DEFAULT 1,
        MILESTONES JSON
      )
    `;

    const values = [this.fullTableName];
    await this.executeQuery(query, values);

    return true;
  }

  async get(id: string): Promise<LevelUpSystemGuildProfileJSON | undefined> {
    const query = `SELECT * FROM ${this.fullTableName} WHERE id = ?;`;
    const row = (await this.executeQuery(query, [id])).at(0);

    if (row)
      return {
        id: row.id,
        active: row.active,
        rate: row.rate,
        mỉlestones: row.milestones,
        log_channel_id: row.log_channel_id,
      };

    return undefined;
  }

  async create(
    profleJSON: LevelUpSystemGuildProfileJSON
  ): Promise<LevelUpSystemGuildProfileJSON> {
    const query = `
        INSERT INTO ${this.fullTableName}
            (id, active, log_channel_id, rate, milestones)
        VALUES (?, ?, ?, ?, ?);
    `;

    const values = [
      profleJSON.id,
      profleJSON.active,
      profleJSON.log_channel_id,
      profleJSON.rate,
      JSON.stringify(profleJSON.mỉlestones),
    ];

    await this.executeQuery(query, values);
    return profleJSON;
  }

  async update(
    profileJSON: LevelUpSystemGuildProfileJSON
  ): Promise<LevelUpSystemGuildProfileJSON> {
    const query = `
        UPDATE ${this.fullTableName} tb
            SET tb.active = ?, tb.log_channel_id = ?, tb.rate = ?, tb.milestone
        WHERE tb.id == ?;
    `;
    const values = [
      profileJSON.active,
      profileJSON.log_channel_id,
      profileJSON.rate,
      JSON.stringify(profileJSON.mỉlestones),
      profileJSON.id,
    ];
    await this.executeQuery(query, values);
    return profileJSON;
  }

  async delete(
    config: LevelUpSystemGuildProfileJSON
  ): Promise<LevelUpSystemGuildProfileJSON> {
    const query = `DELETE FROM ${this.fullTableName} WHERE id = ?`;
    await this.executeQuery(query, [config.id]);
    return config;
  }
}
