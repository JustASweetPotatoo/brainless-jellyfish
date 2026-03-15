import { toInsertQuery } from "../../../utils/toQuery";
import DatabaseManager from "../../DatabaseManager";
import UserLevelProfile, { UserLevelProfileJSON } from "../../model/UserLevelProfile";
import { Repository } from "../constructor/Repository";

export default class UserLevelProfileRepository extends Repository {
  constructor(database: DatabaseManager) {
    super("user_level_profiles", database);
  }

  async create(data: { id: string; guildId: string }): Promise<UserLevelProfileJSON> {
    const query = `INSERT INTO ${this.fullTableName} (id, guild_id) VALUES (?, ?);`;
    const values = [data.id, data.guildId];
    await this.executeQuery(query, values);
    return new UserLevelProfile({ id: data.id, guildId: data.guildId }).toJSON();
  }

  async getOrderBy(data: any, DESC: boolean): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async createTable(): Promise<boolean> {
    const query = `CREATE TABLE IF NOT EXISTS ${this.fullTableName} (
        id VARCHAR(64) PRIMARY KEY NOT NULL,
        guild_id VARCHAR(64) PRIMARY KEY NOT NULL,

        \`level\` INT DEFAULT 0,
        exp INT DEFAULT 0,
        achivement_id VARCHAR(64),
        guild_achivement_id VARCHAR(64),
        achivement_type VARCHAR(64),

        FOREIGN KEY (fk_user_id) REFERENCES \`users\`(id),
        FOREIGN KEY (fk_guild_id) REFERENCES \`guilds\`(id)
      );
    `;

    try {
      await this.executeQuery(query, []);
    } catch (e) {
      return false;
    }

    return true;
  }

  async get(data: {
    id: string;
    guildId: string;
  }): Promise<UserLevelProfileJSON | undefined> {
    const query = `SELECT * FROM ${this.fullTableName}
        WHERE id = ? AND guild_id = ?;
    `;
    const values = [data.id, data.guildId];
    const rows = await this.executeQuery(query, values);
    return rows.at(0);
  }

  async getAll(guildId: string): Promise<Array<UserLevelProfileJSON>> {
    const query = `SELECT * FROM ${this.fullTableName}
        WHERE guild_id = ?
        LIMIT 1000;
    `;
    const values = [guildId];
    const rows = await this.executeQuery(query, values);
    return rows;
  }

  async getOrderByLevel(
    guildId: string,
    DESC: boolean,
    limit: number = 10
  ): Promise<Array<UserLevelProfileJSON>> {
    const query = `SELECT * FROM ${this.fullTableName}
        WHERE guild_id = ?
        ORDER BY level ${DESC ? "DESC" : "ASC"}
        LIMIT ?;
    `;
    const values = [guildId, limit];
    const rows = await this.executeQuery(query, values);
    return rows;
  }

  async getOrderByExp(
    guildId: string,
    DESC: boolean,
    limit: number = 10
  ): Promise<Array<UserLevelProfileJSON>> {
    const query = `SELECT * FROM ${this.fullTableName}
        WHERE guild_id = ?
        ORDER BY exp ${DESC ? "DESC" : "ASC"}
        LIMIT ?;
    `;
    const values = [guildId, limit];
    const rows = await this.executeQuery(query, values);
    return rows;
  }

  async getRankByExp(data: {
    id: string;
    guildId: string;
  }): Promise<{ rank: number; userProfle: UserLevelProfileJSON } | undefined> {
    const query = `
      SELECT 
        u.*,
        (
          SELECT COUNT(*) + 1
          FROM ${this.fullTableName} u2
          WHERE u2.guild_id = u.guild_id
            AND u2.exp > u.exp
        ) AS \`rank\`
      FROM ${this.fullTableName} u
      WHERE u.guild_id = ?
        AND u.id = ?;
    `;
    const values = [data.guildId, data.id];
    const rows = await this.executeQuery(query, values);

    return rows.at(0) ? { rank: rows[0].rank, userProfle: rows[0] } : undefined;
  }

  async insert(
    userData: UserLevelProfileJSON
  ): Promise<UserLevelProfileJSON | undefined> {
    const rows = await this.executeQuery(...toInsertQuery(this.tableName, userData, 2));
    return rows.at(0);
  }

  async update(
    userData: UserLevelProfileJSON
  ): Promise<UserLevelProfileJSON | undefined> {
    const query = `
    UPDATE ${this.fullTableName} 
      SET level = ?, 
        exp = ?, 
        message_count = ?,
        role_achivement_id = ?, 
        ranking_type = ? 
    WHERE id = ? AND guild_id = ?;
    `;

    const values = [
      userData.level,
      userData.exp,
      userData.message_count,
      userData.role_achivement_id,
      userData.ranking_type,
      userData.id,
      userData.guild_id,
    ];
    const rows = await this.executeQuery(query, values);
    return userData;
  }

  async delete(userData: UserLevelProfileJSON): Promise<UserLevelProfileJSON> {
    const query = `DELETE FROM ${this.tableName}
        WHERE id = ? AND guild_id = ?;
    `;
    const values = [userData.id, userData.guild_id];
    await this.executeQuery(query, values);
    return userData;
  }
}
