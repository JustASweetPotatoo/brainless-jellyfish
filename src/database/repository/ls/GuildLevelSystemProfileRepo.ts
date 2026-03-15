import GuildLevelSystemProfile, {
  GuildLevelSystemProfileJSON,
} from "../model/GuildLevelSystemProfile";
import {
  BaseRepositoryOptions,
  Repository,
  BaseRepositoryOptions,
} from "../constructor/Repository";

export interface UserLevelProfileRepositoryOptions extends BaseRepositoryOptions {}

export default class GuildLevelSystemProfileRepo extends Repository<BaseRepositoryOptions> {
  constructor(options: UserLevelProfileRepositoryOptions) {
    super({ ...options, tableName: "guild_level_system_profiles" });
  }

  async creeate(data: { guildId: string }): Promise<void> {
    const query = `INSERT INTO ${this.fullQueryTableName} (id) VALUES (?);`;
    const values = [data.guildId];
    await this.executeQuery(query, values);
  }

  async get(guildId: string): Promise<GuildLevelSystemProfile | undefined> {
    const query = `SELECT * FROM ${this.fullQueryTableName} WHERE id = ?;`;
    const values = [guildId];
    const rows = await this.executeQuery(query, values);
    return rows.at(0) ? GuildLevelSystemProfile.rowConvert(rows.at(0)) : undefined;
  }

  async update(data: GuildLevelSystemProfileJSON): Promise<void> {
    const query = `UPDATE ${this.fullQueryTableName} SET ? WHERE id = ?;`;
    const values = [data, data.id];
    await this.executeQuery(query, values);
  }
}
