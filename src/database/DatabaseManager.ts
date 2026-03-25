import { ConnectionOptions, createPool, Pool, RowDataPacket } from "mysql2/promise";

import MassClient from "../Client";
import { Logger } from "../logger/Logger";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";

export default class DatabaseManager {
  private readonly client: MassClient;
  private readonly logger: Logger;
  public defaultPool: Pool;
  private readonly pools: Pool[] = [];
  public readonly name: string = "main";

  // Only use on debug server !
  private readonly defaultConnectOptions: ConnectionOptions = {
    host: "localhost",
    user: "root",
    password: "root",
  };

  constructor(client: MassClient) {
    this.client = client;
    this.logger = new Logger({ label: "db-manager", printer: client.logPrinter });
  }

  async createSchema(): Promise<boolean> {
    if (!this.defaultPool) {
      this.logger.warn("Pool is not available of undefined !");
      return false;
    }
    try {
      this.logger.log("Creating schema...");
      await this.executeQuery("CREATE SCHEMA IF NOT EXISTS `bot`");
      this.logger.success("Created schema !");
    } catch (error) {
      this.logger.error("", (error as Error) || (error as ClientError));
      return false;
    }
    return true;
  }

  async selectSchema(): Promise<boolean> {
    if (!this.defaultPool) {
      throw new ClientError(ErrorCode.POOL_NOT_FOUND);
    }
    await this.executeQuery("USE `bot`;");
    this.logger.info("Using schema 'bot' of default pool");
    return true;
  }

  async createConnection(connectionOptions?: ConnectionOptions): Promise<boolean> {
    this.logger.log("Creating conneciton...");
    try {
      this.defaultPool = createPool(connectionOptions ?? this.defaultConnectOptions);
      this.logger.success(`Created pool, ${this.defaultPool.threadId}`);
    } catch (error) {
      this.logger.error("", error);
      return false;
    }
    return true;
  }

  async destroyAllConnection() {
    this.logger.log("Destroying all connection...");
    await this.defaultPool?.end();
    this.logger.success("All connection and pool closed.");
  }

  public async executeQuery(query: string, values?: Array<any>): Promise<Array<any>> {
    if (!this.defaultPool) {
      throw new ClientError(ErrorCode.POOL_NOT_FOUND);
    } else {
      const [rows] = await this.defaultPool.query<RowDataPacket[]>(query, values);
      return rows;
    }
  }

  public getLogger(): Logger {
    return this.logger;
  }
}
