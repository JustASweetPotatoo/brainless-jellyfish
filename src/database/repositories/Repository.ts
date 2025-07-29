import { Pool, RowDataPacket } from "mysql2/promise";
import ClientError from "../../error/ClientError";
import { ErrorCode } from "../../error/ClientErrorCode";
import { Client, Collection } from "discord.js";

// export interface CreateSchemaOptions {
//   name: string;
//   schema: string;
//   rows: Array<ValueOptions>;
// }

// export interface ValueOptions {
//   type: string;
//   length: number;
//   default: any;
//   unique: boolean;
//   primaryKey: boolean;
// }

// export enum valueType {
//   INT = "INT",
//   BIGINT = "BIGINT",
//   VARCHAR = "VARCHAR",
//   TEXT = "TEXT",
//   JSON = "JSON",
// }

// function checkType() {
// }

export abstract class Repository {
  protected pool?: Pool;
  protected readonly databaseName: string = "`suwa_client`";
  protected abstract readonly tableName: string;

  setPool(pool?: Pool) {
    this.pool = pool;
  }

  abstract update(id: string, data?: any): Promise<any>;
  abstract get(id: string, args?: any): Promise<any>;
  abstract delete(id: string, args?: any): Promise<any>;
  abstract getAll(limit: number, seachValues?: any): Promise<Array<any> | Collection<any, any> | undefined>;

  async executeQuery(query: string, values: Array<any>): Promise<Array<any>> {
    if (!this.pool) throw new ClientError("", ErrorCode.POOL_NOT_FOUND);
    else {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, values);
      return rows;
    }
  }
}

// All task just only be execute after create connection success
export class DatabaseInitializer {
  private pool?: Pool;

  setPool(pool?: Pool) {
    this.pool = pool;
  }

  public async verifySchema(): Promise<boolean> {
    try {
      if (!this.pool) {
        throw new ClientError("Pool not found", ErrorCode.EXECUTE_QUERY_FAILED);
      }
      const tableName = ["guild", "log_channel", "msg_log_channel"];

      await this.executeQuery("USE `bot`;", []);

      for (const name in tableName) {
        await this.executeQuery(`SELECT * FROM \`bot\`.\`${name}\` WHERE 'id' = ''`, []);
      }
      return true;
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("1049")) {
        return false;
      } else {
        throw new ClientError(undefined, ErrorCode.EXECUTE_QUERY_FAILED, error);
      }
    }
  }

  public async createSchema() {
    if (!(await this.verifySchema())) {
      const createSchemaQuery = `CREATE SCHEMA IF NOT EXTSTS \`bot\``;
      const createTableQuery = [
        `USE \`bot\`;`,
        `
        CREATE TABLE IF NOT EXISTS \`guild\`(
          \`id\` VARCHAR(200) NOT NULL,
          \`premium_state\` VARCHAR(200) NOT NULL DEFAULT 'DEFAULT',
          PRIMARY KEY (\`id\`)
        );
        `,
        `
        CREATE TABLE IF NOT EXISTS \`log_channel\` (
          \'id\' VARCHAR(200) NOT NULL,
          \'guild_id\' VARCHAR(200) NOT NULL,
          PRIMARY KEY (\'id\'),
          CONSTRAINT \`fk_guild_id\`
            FOREIGN KEY \`guild_id\`
            REFERENCES \`bot\`.\`guild\` (\`id\`)
        );
        `,
        `
          CREATE TABLE IF NOT EXISTS \`bot\`.\`msg_log_channel\` (
          \'id\' VARCHAR(200) NOT NULL,
          \'guild_id\' VARCHAR(200) NOT NULL,
          \`record_attachment\` TINYINT NOT NULL DEFAULT 0,
          PRIMARY KEY (\'id\'),
          CONSTRAINT \`fk_guild_id\`
            FOREIGN KEY \`guild_id\`
            REFERENCES \`bot\`.\`guild\` (\`id\`)
          );
        `,
        // `
        //   CREATE TABLE IF NOT EXISTS \`bot\`.\`\`
        // `,
      ];

      await this.executeQuery(createSchemaQuery, []);
      for (const query in createTableQuery) {
        await this.executeQuery(query, []);
      }
    }
  }

  private async executeQuery(query: string, values: Array<any>): Promise<Array<any>> {
    if (!this.pool) throw new ClientError("No pool was selected or undefined", ErrorCode.POOL_NOT_FOUND);
    else {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, values);
      return rows;
    }
  }
}
