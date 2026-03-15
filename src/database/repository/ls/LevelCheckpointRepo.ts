import GuildLevelCheckpoint, {
  GuildLevelCheckpointJSON,
} from "../model/GuildLevelCheckPoint";
import { BaseRepositoryOptions, Repository } from "../constructor/Repository";
import { BaseRepositoryOptions } from "../constructor/Repository";

export default class GuildLevelCheckpointRepo extends Repository<BaseRepositoryOptions> {
  constructor(options: BaseRepositoryOptions) {
    super({ ...options, tableName: "checkpoint_roles" });
  }

  async createTable(): Promise<boolean> {
    try {
      const query = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        guild_id VARCHAR(255) NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        start_level INT NOT NULL,
        end_level INT NOT NULL,
        PRIMARY KEY (guild_id)
      )
    `;
      await this.executeQuery(query, []);
      return true;
    } catch (error) {
      return false;
    }
  }

  async get(options: {
    roleId: string;
    guildId: string;
  }): Promise<GuildLevelCheckpointJSON | undefined> {
    const query = `SELECT * FROM ${this.fullQueryTableName} WHERE role_id = ? AND guild_id = ?;`;
    const values = [options.roleId, options.guildId];
    const rows = await this.executeQuery(query, values);
    return rows.at(0);
  }

  async create(checkpoint: GuildLevelCheckpointJSON): Promise<GuildLevelCheckpointJSON> {
    const query = `
    INSERT INTO ${this.fullQueryTableName} 
      (guild_id, role_id, start_level, end_level, color)
    VALUES (?, ?, ?, ?, ?, ?);
    `;
    const values = [
      checkpoint.guild_id,
      checkpoint.role_id,
      checkpoint.start_level,
      checkpoint.end_level,
      checkpoint.color,
    ];

    await this.executeQuery(query, values);

    return checkpoint;
  }

  async update(checkpoint: GuildLevelCheckpointJSON): Promise<GuildLevelCheckpoint> {
    const query = `
    UPDATE ${this.fullQueryTableName} cp 
      SET cp.start_level = ?, cp.end_level = ?, cp.color = ?
    WHERE cp.id = ? AND cp.guild_id = ?;
    `;
    const values = [
      checkpoint.start_level,
      checkpoint.end_level,
      checkpoint.color,
      checkpoint.role_id,
      checkpoint.guild_id,
    ];
    await this.executeQuery(query, values);
    return GuildLevelCheckpoint.rowConvert(checkpoint);
  }

  async getAllOrderByGuildId(guildId: string): Promise<Array<GuildLevelCheckpointJSON>> {
    const query = `SELECT * FROM ${this.fullQueryTableName} WHERE guild_id = ?;`;
    const values = [guildId];
    const rows = await this.executeQuery(query, values);
    return rows;
  }
}
