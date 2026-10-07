import {
  Connection,
  ConnectionOptions,
  createConnection,
  createPool,
  Pool,
  RowDataPacket,
} from "mysql2/promise";

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
  private readonly client: MassClient;
  private readonly logger: Logger;
  public defaultPool: Pool;
  readonly name: string;

  private readonly defaultConnectOptions: ConnectionOptions = {
    host: DB_HOST,
    port: parseInt(DB_PORT ?? "3306"),
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  };

  constructor(client: MassClient) {
    super();
    this.client = client;
    this.logger = new Logger({
      label: "db-manager",
      printer: this.client.logPrinter,
    });

    this.name = DB_NAME ?? "main";
  }

  /**
   *
   * @deprecated
   */
  async createSchema(connection: Connection): Promise<boolean> {
    try {
      await connection.query(`CREATE SCHEMA \`${this.defaultConnectOptions.database}\``);
      this.logger.ok(`Created schema with name ${this.name}`);
    } catch (error) {
      if ((error as Error).message.includes("database exists")) {
        this.logger.warn(`Database existed with name ${this.name}`);
        return true;
      }

      this.logger.error(error);
      return false;
    }

    return true;
  }

  /**
   *
   * @deprecated
   */
  async createConnection(connectionOptions?: ConnectionOptions): Promise<boolean> {
    this.logger.log("Creating conneciton");
    try {
      const connectOptions = { ...this.defaultConnectOptions };
      connectOptions.database = undefined;

      const connection = await createConnection(connectOptions);
      const res = await this.createSchema(connection);
      await connection.end();

      if (res) {
        this.logger.ok("Created connection!");
        this.defaultPool = createPool(this.defaultConnectOptions);
        this.logger.ok(`Created new pool, running at thread: ${this.defaultPool.threadId}`);
      }

      return res;
    } catch (error) {
      this.logger.error("Create connection failed!");
      this.logger.error(new ClientError(ErrorCode.DATABASE_CONNECT_FAILED, error));
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
}
