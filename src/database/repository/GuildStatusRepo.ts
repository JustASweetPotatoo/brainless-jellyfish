import { Repository } from "./constructor/Repository";
import GuildStatus, { GuildStatusObj } from "../model/GuildStatus";
import DatabaseManager from "../DatabaseManager";

export default class GuildStatusRepository extends Repository<GuildStatus, GuildStatusObj> {
  protected readonly createTableQuery: string = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName}
    (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      premium_status TINYINT NOT NULL DEFAULT 0,
      active_list JSON
    );
  `;
  protected model: { fromJSON(json: GuildStatusObj): GuildStatus };

  constructor(database: DatabaseManager) {
    super("guild_status_repository", database);
  }

  async get(guildId: string): Promise<GuildStatus> {
    const query = `SELECT * FROM ${this.fullTableName} WHERE id = ?;`;
    const row = await this.executeQuery(query, [guildId], true);

    if (!row) {
      return this.create(new GuildStatus({ id: guildId }));
    }

    return new GuildStatus(row as GuildStatusObj);
  }

  async create(data: GuildStatus): Promise<GuildStatus> {
    const query = `
      INSERT INTO ${this.fullTableName}
      (id, premium_status, active_list)
      VALUES (?,?,?);
    `;
    const values = [data.id, data.premiumStatus, JSON.stringify(data.activeList)];
    await this.executeQuery(query, values);
    return data;
  }

  async update(data: GuildStatus): Promise<GuildStatus> {
    const query = `
      UPDATE ${this.fullTableName}
      SET 
        premium_status = ?,
        active_list = ?
      WHERE id = ?;
    `;
    const values = [data.premiumStatus, JSON.stringify(data.activeList), data.id];

    await this.executeQuery(query, values);
    return data;
  }

  async delete(id: string): Promise<boolean> {
    const query = `
      DELETE * FROM ${this.fullTableName} WHERE id = ?
    `;
    const values = [id];
    await this.executeQuery(query, values);
    return true;
  }
}
