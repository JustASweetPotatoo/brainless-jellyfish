import {
  BaseRepositoryOptions,
  Repository,
  BaseRepositoryOptions,
} from "../constructor/Repository";
import ClientGuild, { ClientGuildJSON } from "../../model/ls/ClientGuild";

export interface ClientGuildRepositoryOptions extends BaseRepositoryOptions {}

export default class ClientGuildRepository extends Repository<BaseRepositoryOptions> {
  constructor(options: ClientGuildRepositoryOptions) {
    super({ ...options, tableName: "guilds" });
  }

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.fullQueryTableName}
      (
        id VARCHAR(64) PRIMARY KEY NOT NULL,
        create_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        level_system_active INT NOT NULL DEFAULT 0,

        noitu_game_active INT NOT NULL DEFAULT 0,
        noitu_max_channel INT NOT NULL DEFAULT 1,
        noitu_channel_list TEXT,
      );
    `;

    throw new Error("Method not implemented.");
  }

  async create(data: string): Promise<ClientGuild> {
    const query = `
      INSERT INTO ${this.fullQueryTableName} (id) VALUES(?);
    `;
    const values = [data];
    await this.executeQuery(query, values);
    return new ClientGuild({ id: data });
  }

  async update(data: ClientGuild): Promise<ClientGuild> {
    const query = `
      UPDATE ${this.fullQueryTableName}
      SET level_system_active = ?,
        message_logger_active = ?,
        noitu_game_active = ?,
        noitu_max_channel = ?,
        noitu_channel_list = ?
      WHERE id = ?;
    `;
    const values = [
      data.levelSystemActive,
      data.messageLoggerActive,
      data.noituGameActive,
      data.noituMaxChannel,
      data.noituChannelList.join("/"),
      data.id,
    ];
    await this.executeQuery(query, values);
    return data;
  }

  async delete(data: string): Promise<void> {
    const query = `DELETE FROM ${this.fullQueryTableName} WHERE id = ?;`;
    const values = [data];
    await this.executeQuery(query, values);
  }

  async get(data: string): Promise<ClientGuild | undefined> {
    const query = `SELECT * FROM ${this.fullQueryTableName} WHERE id = ?;`;
    const values = [data];
    const rows = await this.executeQuery(query, values);
    return rows.at(0) ? ClientGuild.rowConvert(rows.at(0)) : undefined;
  }

  async getAll(limit: number = 100): Promise<Array<ClientGuild>> {
    const query = `SELECT * FROM ${this.fullQueryTableName} LIMIT ${limit}`;
    const rows = await this.executeQuery(query, []);
    return rows.map((row) => ClientGuild.rowConvert(row));
  }

  async getOrderBy(
    data: getOrderByClientGuildOptions,
    DESC: boolean
  ): Promise<ClientGuild> {
    throw new Error("Method not implemented.");
  }
}

export enum getOrderByClientGuildOptions {}
