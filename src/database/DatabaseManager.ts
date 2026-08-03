import { ConnectionOptions, createPool, Pool, RowDataPacket } from "mysql2/promise";

import MassClient from "../Client";
import { Logger } from "../logger/Logger";
import ClientError from "../error/ClientError";
import { ErrorCode } from "../error/ErrorCode";
import { configDotenv } from "dotenv";
import { EventEmitter } from "stream";
import { DataSource } from "typeorm";

configDotenv();
const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

export default class DatabaseManager extends EventEmitter {
  private readonly dataSource: DataSource;
  private readonly client: MassClient;
  private readonly logger: Logger;
  public defaultPool: Pool;
  readonly name: string;

  private readonly defaultConnectOptions: ConnectionOptions;

  constructor(client: MassClient) {
    super();
    this.client = client;
    this.logger = new Logger({
      label: "db-manager",
      printer: this.client.logPrinter,
    });

    this.dataSource = new DataSource({
      type: "mysql",
      host: DB_HOST,
      port: parseInt(DB_PORT ?? "3306"),
      username: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    this.defaultConnectOptions = {
      host: DB_HOST,
      port: parseInt(DB_PORT ?? "3306"),
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    };

    this.name = DB_NAME ?? "main";
  }

  /**
   *
   * @deprecated
   */
  async createSchema(): Promise<boolean> {
    if (!this.defaultPool) {
      this.logger.warn("Pool is not available of undefined !");
      return false;
    }
    try {
      this.logger.log("Creating schema...");
      await this.executeQuery(`CREATE SCHEMA IF NOT EXISTS \`${this.defaultConnectOptions.database}\``);
      this.logger.ok(`Created schema with name ${this.name}`);
    } catch (error) {
      this.logger.error({ error: error });
      return false;
    }
    return true;
  }

  /**
   *
   * @deprecated
   */
  async selectSchema(): Promise<boolean> {
    if (!this.defaultPool) {
      throw new ClientError(ErrorCode.POOL_NOT_FOUND);
    }
    await this.executeQuery(`USE \`${this.defaultConnectOptions.database}\`;`);
    this.logger.info(`Using schema ${this.defaultConnectOptions.database} of default pool`);
    return true;
  }
  /**
   *
   * @deprecated
   */
  async createConnection(connectionOptions?: ConnectionOptions): Promise<boolean> {
    this.logger.log("Creating conneciton...");
    try {
      this.defaultPool = createPool(connectionOptions ?? this.defaultConnectOptions);
      await this.createSchema();
      await this.selectSchema();
      this.logger.ok(`Created pool, ${this.defaultPool.threadId}`);

      this.emit("database-connected");
      return true;
    } catch (error) {
      this.logger.error({ error: error });
      return false;
    }
  }

  /**
   *
   * @deprecated
   */
  async destroyAllConnection() {
    this.logger.log("Destroying all connection...");
    await this.defaultPool?.end();
    this.logger.ok("All connection and pool closed.");
  }

  /**
   *
   * @deprecated
   */
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

  public async createDataSourceConnection() {
    try {
      this.logger.log("Creating database connection");
      await this.dataSource.initialize();
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
