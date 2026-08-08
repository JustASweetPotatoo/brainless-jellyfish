import { Collection } from "discord.js";
import DatabaseManager from "../DatabaseManager";
import UserLevelProfile, { UserLevelProfileJson } from "../model/UserLevelProfile";
import { Repository } from "./constructor/Repository";

export default class UserlevelProfileRepo extends Repository<UserLevelProfile, UserLevelProfileJson> {
  protected model: { fromJSON(json: UserLevelProfileJson): UserLevelProfile };

  protected readonly createTableQuery = `
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
    super("level_user_profile", database);
  }

  async get(options: { id: string; guildId: string }): Promise<UserLevelProfile> {
    const query = `
      SELECT * FROM ${this.fullTableName}
      WHERE id = ? AND guild_id = ?
      LIMIT 1;
    `;

    const rows = await this.executeQuery(query, [options.id, options.guildId]);
    const row = rows.at(0);
    if (row) {
      return new UserLevelProfile(row as UserLevelProfileJson);
    }
    return this.create(options);
  }

  async create(options: { id: string; guildId: string }): Promise<UserLevelProfile> {
    const newProfile = new UserLevelProfile({
      id: options.id,
      guild_id: options.guildId,
      message_exp: 0,
      voice_exp: 0,
      milestone_id: "",
    });

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

    return newProfile;
  }

  async update(profile: UserLevelProfile): Promise<UserLevelProfile> {
    const json = profile.toJSON();

    const query = `
      UPDATE ${this.fullTableName}
      SET
        message_exp = ?,
        voice_exp = ?,
        milestone_id = ?
      WHERE id = ? AND guild_id = ?;
    `;

    await this.executeQuery(query, [json.message_exp, json.voice_exp, json.milestone_id, json.id, json.guild_id]);

    return profile;
  }

  async updateByMessageLevel(profile: UserLevelProfile): Promise<UserLevelProfile> {
    const obj = profile.toJSON();

    const query = `
      UPDATE ${this.fullTableName}
      SET
        message_exp = ?,
        milestone_id = ?
      WHERE id = ? AND guild_id = ?;
    `;

    await this.executeQuery(query, [obj.message_exp, obj.milestone_id, obj.id, obj.guild_id]);

    return profile;
  }

  async updateByVoiceLevel(profile: UserLevelProfile): Promise<UserLevelProfile> {
    const obj = profile.toJSON();

    const query = `
      UPDATE ${this.fullTableName}
      SET
        voice_exp = ?,
        milestone_id = ?
      WHERE id = ? AND guild_id = ?;
    `;

    await this.executeQuery(query, [obj.voice_exp, obj.milestone_id, obj.id, obj.guild_id]);

    return profile;
  }

  async getOrderByLevelInGuild(
    guild_id: string,
    page: number = 1,
    DESC: boolean = true,
    isVoice: boolean = false,
  ): Promise<Array<UserLevelProfile>> {
    const query = `
      SELECT * FROM ${this.fullTableName}
      WHERE guild_id = ?
      ORDER BY ${isVoice ? "voice_exp" : "message_exp"} ${DESC ? "DESC" : "ASC"}
      LIMIT 10 OFFSET ${10 * (page - 1)};
    `;
    const rows = await this.executeQuery(query, [guild_id]);
    const array: UserLevelProfile[] = [];
    rows.forEach((row) => array.push(new UserLevelProfile(row as UserLevelProfileJson)));

    return array;
  }

  async getRankIncluded(
    id: string,
    guildId: string,
    isVoice = false,
  ): Promise<UserLevelProfileJson & { rank: number }> {
    const target = isVoice ? "voice_exp" : "message_exp";

    const query = `
      SELECT
        u.*,
        (
          SELECT COUNT(*) + 1
          FROM ${this.tableName}
          WHERE ${target} > u.${target}
        ) AS \'rank\'
      FROM ${this.tableName} u
      WHERE u.id = ? AND u.guild_id = ?;
    `;

    let res = await this.executeQuery(query, [id, guildId]);

    if (!res.at(0)) {
      await this.create({ id, guildId });
      res = await this.executeQuery(query, [id, guildId]);
    }

    return res[0] as UserLevelProfileJson & { rank: number };
  }

  delete(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
