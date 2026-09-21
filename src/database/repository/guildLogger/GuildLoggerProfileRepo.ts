import DatabaseManager from "../../DatabaseManager";
import GuildLoggerProfile, {
  GuildLoggerProfileJson,
  GuildLoggerProfileOptions,
} from "../../model/logger/GuildLoggerProfile";
import { Repository } from "../constructor/Repository";

export default class GuildLoggerProfileRepo extends Repository<
  GuildLoggerProfile,
  GuildLoggerProfileJson
> {
  protected readonly model = GuildLoggerProfile;

  protected readonly createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
      guild_id VARCHAR(32) PRIMARY KEY,
      message_channel_id VARCHAR(32),
      user_channel_id VARCHAR(32),
      user_join_leave_channel_id VARCHAR(32),
      voice_channel_id VARCHAR(32),
      guild_channel_id VARCHAR(32)
    )
  `;

  constructor(database: DatabaseManager) {
    super("guild_logger_profile", database);
  }

  async create(data: GuildLoggerProfile): Promise<GuildLoggerProfile> {
    const json = data.toJSON();

    await this.executeQuery(
      `INSERT INTO ${this.fullTableName} (
        guild_id,
        message_channel_id,
        user_channel_id,
        user_join_leave_channel_id,
        voice_channel_id,
        guild_channel_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        message_channel_id = ?, 
        user_channel_id = ?, 
        user_join_leave_channel_id = ?, 
        voice_channel_id = ?, 
        guild_channel_id = ?
      `,
      [
        json.guild_id,
        json.message_channel_id,
        json.user_channel_id,
        json.user_join_leave_channel_id,
        json.voice_channel_id,
        json.guild_channel_id,
        json.message_channel_id,
        json.user_channel_id,
        json.user_join_leave_channel_id,
        json.voice_channel_id,
        json.guild_channel_id,
      ],
    );

    return data;
  }

  async update(data: GuildLoggerProfile): Promise<GuildLoggerProfile> {
    const json = data.toJSON();

    await this.executeQuery(
      `UPDATE ${this.fullTableName}
       SET 
        message_channel_id = ?, 
        user_channel_id = ?, 
        user_join_leave_channel_id = ?, 
        voice_channel_id = ?, 
        guild_channel_id = ?
       WHERE guild_id = ?`,
      [
        json.message_channel_id,
        json.user_channel_id,
        json.user_join_leave_channel_id,
        json.voice_channel_id,
        json.guild_channel_id,
        json.guild_id,
      ],
    );

    return data;
  }

  async delete(id: string): Promise<boolean> {
    await this.executeQuery(`DELETE FROM ${this.fullTableName} WHERE guild_id = ?`, [id]);

    return true;
  }

  async get(guildId: string, autoCreate: true): Promise<GuildLoggerProfile>;

  async get(guildId: string): Promise<GuildLoggerProfile | undefined>;

  async get(guildId: string, autoCreate?: boolean): Promise<GuildLoggerProfile | undefined> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.fullTableName} WHERE guild_id = ? LIMIT 1;`,
      [guildId],
    );

    if (autoCreate && rows.length == 0) {
      const newProf = new GuildLoggerProfile({
        guildId: guildId,
      } as GuildLoggerProfileOptions);
      return await this.create(newProf);
    }

    return rows.length > 0 ? this.model.fromJSON(rows[0] as GuildLoggerProfileJson) : undefined;
  }
}
