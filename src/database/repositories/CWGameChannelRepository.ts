import { ConnectWordChannelConfigJSON } from "../../structure/interface/ConnectWordGame";
import { toInsertQuery } from "../../utils/functions";
import { CWChannelProfile } from "../models/CWChannelProfile";
import { Repository } from "./Repository";

export class CWGameChannelRepository extends Repository {
  protected readonly tableName = "`connecting_word_channel_config`";

  async update(id: string, data: ConnectWordChannelConfigJSON): Promise<boolean> {
    await this.executeQuery(...toInsertQuery(this.tableName, data, 2));
    return true;
  }

  async get(id: string): Promise<CWChannelProfile | undefined> {
    let query = `SELECT * FROM ${this.tableName} WHERE channel_id = ?;`;
    const rows = await this.executeQuery(query, [id]);
    if (rows[0]) {
      return new CWChannelProfile(rows[0].channel_id, rows[0].guild_id).update(rows[0]);
    } else {
      return undefined;
    }
  }

  async delete(id: string): Promise<void> {
    let query = `DELETE FROM ${this.tableName} WHERE channel_id = ?;`;
    await this.executeQuery(query, [id]);
    return;
  }

  async getAll(): Promise<Array<CWChannelProfile>> {
    let query = `SELECT * FROM ${this.tableName};`;
    const rows = await this.executeQuery(query, []);
    return rows.map((row) => new CWChannelProfile(rows[0].channel_id, rows[0].guild_id).update(rows[0]));
  }
}
