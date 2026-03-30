import ClientError from "../../error/ClientError";
import { ErrorCode } from "../../error/ErrorCode";
import DatabaseManager from "../DatabaseManager";
import { LevelUpSystemGuildProfileJSON } from "../model/LevelUpSystemGuildProfile";
import { Repository } from "./constructor/Repository";

export default class LevelUpSystemGuildProfileRepo extends Repository {
  readonly createTableQuery: string = `
      CREATE TABLE IF NOT EXISTS ${this.fullTableName}
      (
        id VARCHAR(64) NOT NULL,
        guild_id VARCHAR(64) NOT NULL,
        message_exp BIGINT DEFAULT 0,
        voice_exp BIGINT DEFAULT 0,
        milestone_id VARCHAR(64),
        PRIMARY KEY (id, guild_id)
      );
    `;

  constructor(database: DatabaseManager) {
    super("level_up_guild_profile", database);
  }

  async createTable() {
    try {
      const query = `
      CREATE TABLE IF NOT EXISTS ${this.fullTableName}
      (
        id VARCHAR(64) NOT NULL,
        guild_id VARCHAR(64) NOT NULL,
        message_exp BIGINT DEFAULT 0,
        voice_exp BIGINT DEFAULT 0,
        milestone_id VARCHAR(64),
        PRIMARY KEY (id, guild_id)
      );
    `;

      await this.executeQuery(query, []);
      return await super.createTable();
    } catch (error) {
      this.database
        .getLogger()
        .error(
          new ClientError(ErrorCode.EXECUTE_QUERY_FAILED, undefined, error as Error)
        );
      return false;
    }
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
