import { ConnectingWordChannelConfigJSON } from "../../structure/interface/ConnectingWordGameDataStructure";
import { toInsertQuery } from "../../utils/functions";
import { ConnectingWordChannelConfig } from "../models/ConnectingWordGameChannelConfig";
import { DefautRepository } from "./DefaulRepository";

export class ConnectingWordGameChannelConfigRepository extends DefautRepository {
  private readonly tableName = "`suwa_client`.`connecting_word_channel_config`";

  async update(id: string, data: ConnectingWordChannelConfigJSON): Promise<boolean> {
    await this.executeQuery(...toInsertQuery(this.tableName, data, 2));
    return true;
  }

  async get(id: string): Promise<ConnectingWordChannelConfig | undefined> {
    let query = `SELECT * FROM ${this.tableName} WHERE channel_id = ?;`;
    const rows = await this.executeQuery(query, [id]);
    if (rows[0]) {
      return new ConnectingWordChannelConfig(rows[0].channel_id, rows[0].guild_id).sync(rows[0]);
    } else {
      return undefined;
    }
  }

  async delete(id: string): Promise<void> {
    let query = `DELETE FROM ${this.tableName} WHERE channel_id = ?;`;
    await this.executeQuery(query, [id]);
    return;
  }

  async getAll(): Promise<Array<ConnectingWordChannelConfig>> {
    let query = `SELECT * FROM ${this.tableName};`;
    const rows = await this.executeQuery(query, []);
    return rows.map((row) =>
      new ConnectingWordChannelConfig(rows[0].channel_id, rows[0].guild_id).sync(rows[0])
    );
  }
}
