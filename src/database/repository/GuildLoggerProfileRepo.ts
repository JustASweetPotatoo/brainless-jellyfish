import DatabaseManager from "../DatabaseManager";
import GuildLoggerProfile from "../model/GuildLoggerProfile";
import { Repository } from "./constructor/Repository";

export default class GuildLoggerProfileRepo extends Repository {
  constructor(database: DatabaseManager) {
    super("guild_logger_profiles", database);
  }

  async createTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS ?
        (
            guild_id VARCHAR(64) PRIMARY KEY NOT NULL,
            message_logger_active INT NOT NULL DEFAULT 0,
            message_log_channel_id VARCHAR(64),
            voice_logger_active INT NOT NULL DEFAULT 0,
            voice_log_channel_id VARCHAR(64),
            user_logger_active INT NOT NULL DEFAULT 0,
            user_log_channel_id VARCHAR(64),
            moderation_logger_active INT NOT NULL DEFAULT 0,
            moderation_log_channel_id VARCHAR(64)
        );
    `;
    const values = [this.fullTableName];
    await this.executeQuery(query, values);
    return true;
  }

  async create(data: GuildLoggerProfile): Promise<GuildLoggerProfile> {
    const query = `
      INSERT INTO ${this.fullTableName} (guild_id) VALUES(?);
    `;
    const values = [data.guildId];
    await this.executeQuery(query, values);
    return new GuildLoggerProfile({ guildId: data.guildId });
  }

  async update(data: GuildLoggerProfile): Promise<GuildLoggerProfile> {
    const query = `
      UPDATE ${this.fullTableName}
      SET message_logger_active = ?,
        message_log_channel_id = ?,
        voice_logger_active = ?,
        voice_log_channel_id = ?,
        user_logger_active = ?,
        user_log_channel_id = ?,
        moderation_logger_active = ?,
        moderation_log_channel_id = ?
        WHERE guild_id = ?;
    `;
    const values = [
      data.messageLoggerActive,
      data.messageLogChannelId,
      data.voiceLoggerActive,
      data.voiceLogChannelId,
      data.userLoggerActive,
      data.userLogChannelId,
      data.moderationLoggerActive,
      data.moderationLogChannelId,
      data.guildId,
    ];
    await this.executeQuery(query, values);
    return data;
  }

  async delete(data: string): Promise<void> {
    const query = `DELETE FROM ${this.fullTableName} WHERE guild_id = ?;`;
    const values = [data];
    await this.executeQuery(query, values);
  }

  async get(guildId: string): Promise<GuildLoggerProfile | undefined> {
    const query = `SELECT * FROM ${this.fullTableName} WHERE guild_id = ?;`;
    const values = [guildId];
    const result = await this.executeQuery(query, values);
    return result.length > 0 ? GuildLoggerProfile.toThis(result[0]) : undefined;
  }

  async getAll(limit: number = 100): Promise<any> {
    const query = `SELECT * FROM ${this.fullTableName} LIMIT ?;`;
    const values = [limit];
    const rows = await this.executeQuery(query, values);
    return rows.map((row) => GuildLoggerProfile.toThis(row));
  }

  async getOrderBy(
    rowsName: string,
    DESC: boolean,
    limit: number = 10
  ): Promise<GuildLoggerProfile | undefined> {
    const query = `SELECT * FROM ${this.fullTableName} ORDER BY ? ${
      DESC ? "DESC" : "ASC"
    } LIMIT ?;`;
    const values = [rowsName, limit];
    const result = await this.executeQuery(query, values);
    return result.length > 0 ? GuildLoggerProfile.toThis(result[0]) : undefined;
  }
}
