import { ConnectionOptions, createPool, Pool, RowDataPacket } from "mysql2/promise";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ClientErrorCode";

export default class Connector {
  // private readonly client: SuwaBot;
  private readonly defaultConnectionOptions: ConnectionOptions = {
    host: "localhost",
    user: "root",
    password: "root",
  };

  public pool?: Pool;

  constructor() {
    // this.client = client;
  }

  async checkingConnection(): Promise<any> {
    try {
      if (this.pool) {
        await this.pool.query("SELECT * FROM bot.bot_config;");
      }
      return true;
    } catch (error) {
      return new ClientError("", ErrorCode.DATABASE_CONNECT_FAILED, error as Error);
    }
  }

  createPromisePool(connectionOptions?: ConnectionOptions) {
    try {
      if (this.pool) {
        this.pool = undefined;
      }

      if (connectionOptions) {
        this.pool = createPool(connectionOptions);
      } else {
        this.pool = createPool(this.defaultConnectionOptions);
      }
      
      return this.pool;
    } catch (error) {
      return error;
    }
  }

  async useDefaultSchema() {
    if (await this.checkingConnection() && this.pool) {
      await this.pool.query("USE `bot`;");
    }
  }
}