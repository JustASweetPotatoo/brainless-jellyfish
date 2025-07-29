import CWGuildProfile, { CWGameGuildProfileJSON } from "../models/CWGuildProfile";
import { Repository } from "./Repository";

export class CWGameGuildRepository extends Repository {
  protected readonly tableName = "`suwa_client`.`connecting_word_guild_config`";
  async update(id: string): Promise<boolean> {
    const query = `INSERT INTO ${this.tableName} (\`guild_id\`) VALUES (?);`;
    await this.executeQuery(query, [id]);
    return true;
  }

  async get(id: string): Promise<CWGuildProfile | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE \`id\`='?';`;
    const values = [id];
    const rows = await this.executeQuery(query, values);
    if (rows.length == 0) return null;
    else return new CWGuildProfile(rows[0].guild_id);
  }

  async delete(): Promise<void> {
    return;
  }

  async getAll(): Promise<Array<CWGuildProfile>> {
    const query = `SELECT * FROM ${this.tableName};`;
    const rows = await this.executeQuery(query, []);
    return rows.map((data) => new CWGuildProfile(data.guild_id).update(data));
  }
}
