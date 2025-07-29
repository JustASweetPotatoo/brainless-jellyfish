import { Collection, Message } from "discord.js";
import { toInsertQuery } from "../../utils/functions";
import MessageLoggerGuildProfile from "../models/MessageLoggerGuildProfile";
import { Repository } from "./Repository";

export class MessageLoggerGuildProfileRepository extends Repository {
  readonly databaseName = "`bot`";
  readonly tableName = "`message_log_channel`";
  readonly fullTableName = this.databaseName + "." + this.tableName;

  async update(id: string, data: MessageLoggerGuildProfile): Promise<boolean> {
    await this.executeQuery(...toInsertQuery(this.fullTableName, data, 0));
    return true;
  }

  async get(channelId: string, guildId: string): Promise<MessageLoggerGuildProfile | null> {
    let query = `SELECT * FROM ${this.fullTableName} WHERE channel_id = ? AND guild_id = ?;`;
    const rows = await this.executeQuery(query, [channelId, guildId]);

    if (rows[0]) {
      const profile = new MessageLoggerGuildProfile(rows[0].channel_id);
      profile.channelId = rows[0].channel_id;
      return profile;
    }
    return null;
  }

  async delete(channelId: string, guildId: string): Promise<void> {
    let query = `DELETE FROM ${this.fullTableName} WHERE channel_id = ? AND guild_id = ?;`;
    await this.executeQuery(query, [channelId, guildId]);
    return;
  }

  async getAll(): Promise<Collection<string, MessageLoggerGuildProfile>> {
    let query = `SELECT * FROM ${this.fullTableName};`;
    const rows = await this.executeQuery(query, []);

    const collection: Collection<string, MessageLoggerGuildProfile> = new Collection();
    rows.forEach((data, index) => {
      let profile = new MessageLoggerGuildProfile(rows[index].guild_id);
      profile.channelId = rows[index].channel_id;
      collection.set(data.guild_id, profile);
    });

    return collection;
  }
}
