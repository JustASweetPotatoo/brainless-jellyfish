import { Collection } from "discord.js";
import DatabaseManager from "../DatabaseManager";
import UserLevelProfile, { UserLevelProfileJSON } from "../model/UserLevelProfile";
import { Repository } from "./constructor/Repository";

export default class UserlevelProfileRepo extends Repository {
  protected readonly createTableQuery: string = `
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
    super("user_level_profile", database);
  }

  async get(options: { id: string; guildId: string }): Promise<UserLevelProfileJSON> {
    const query = `
      SELECT * FROM ${this.fullTableName}
      WHERE id = ? AND guild_id = ?;
    `;

    const rows = await this.executeQuery(query, Object.values(options));

    if (rows.at(0)) {
      return {
        id: options.id,
        guild_id: options.guildId,
        message_exp: rows.at(0).message_exp,
        voice_exp: rows.at(0).voice_exp,
        milestone_id: rows.at(0).milestone_role_id,
      };
    } else {
      return await this.create({ id: options.id, guildId: options.guildId });
    }
  }

  async create(options: { id: string; guildId: string }): Promise<UserLevelProfileJSON> {
    const newProfile = new UserLevelProfile({ ...options });
    const query = `
      INSERT INTO ${this.fullTableName} 
        (id, guild_id, message_exp, voice_exp, milestone_id)
      VALUES (?, ?, ?, ?, ?);
    `;
    const values = [
      newProfile.id,
      newProfile.guildId,
      newProfile.messageExp,
      newProfile.voiceExp,
      newProfile.milestoneId,
    ];
    await this.executeQuery(query, values);
    return newProfile.toJSON();
  }

  async update(profile: UserLevelProfileJSON): Promise<any> {
    const query = `
      UPDATE ${this.fullTableName} tb
        SET 
          tb.message_exp = ?, voice_exp = ?, milestone_id = ?
      WHERE id = ? AND guild_id = ?;
    `;

    const values = [
      profile.message_exp,
      profile.voice_exp,
      profile.milestone_id,
      profile.id,
      profile.guild_id,
    ];
    await this.executeQuery(query, values);
  }

  async getOrderBy(
    guildId: string,
    DESC: boolean = true
  ): Promise<Collection<string, UserLevelProfileJSON>> {
    const query = `
      SELECT * FROM ${this.fullTableName} tb 
      WHERE guild_id = ? 
      ORDER BY message_exp ${DESC ? "DESC" : "ASC"} 
      LIMIT 10;
    `;
    const collection: Collection<string, UserLevelProfileJSON> = new Collection();
    const rows = await this.executeQuery(query, [guildId]);
    rows.forEach((row) => collection.set(row.id, row));

    return collection;
  }
}
