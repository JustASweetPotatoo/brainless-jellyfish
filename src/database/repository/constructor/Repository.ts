import { Pool, RowDataPacket } from "mysql2/promise";
import ClientError from "../../../error/ClientError";
import { ErrorCode } from "../../../error/ErrorCode";
import DatabaseManager from "../../DatabaseManager";

export interface RepositoryOptions {
  readonly database: DatabaseManager;
}

export abstract class BaseRepository {
  abstract createTable(query: string, values: Array<any>): Promise<boolean>;
  abstract create(data: any): Promise<any>;
  abstract update(data: any): Promise<any>;
  abstract delete(data: any): Promise<any>;

  abstract get(data: any): Promise<any>;
  abstract getAll(data: any): Promise<any>;
  abstract getOrderBy(data: any, DESC: boolean): Promise<any>;
}

export abstract class Repository extends BaseRepository {
  protected readonly database: DatabaseManager;
  public readonly fullTableName: string;
  public readonly databaseName: string;
  private readonly pool: Pool;

  protected abstract readonly createTableQuery: string;

  constructor(readonly tableName: string, database: DatabaseManager) {
    super();

    this.database = database;
    this.databaseName = database.name;
    this.pool = database.defaultPool;

    this.fullTableName = `\`${this.databaseName}\`.\`${this.tableName}\``;

    this.database.on("database-connected", async () => {
      await this.createTable();
    });
  }

  async createTable(): Promise<boolean> {
    const conn = await this.pool.getConnection();

    try {
      await this.executeQuery(this.createTableQuery);
      const [warnings] = await this.executeQuery("SHOW WARNINGS");
      if (warnings.length !== 0) {
        this.database.getLogger().warn(
          `Create table ${this.tableName} warnings: ` +
            Object.entries(warnings)
              .map((value) => value[1])
              .at(2)
        );
      } else {
        this.database.getLogger().success(`Table ${this.tableName} created !`);
      }

      return true;
    } catch (e) {
      this.database.getLogger().error(e);
      return false;
    } finally {
      conn.release();
    }
  }
  async create(data: any): Promise<any> {}
  async update(data: any): Promise<any> {}
  async delete(data: any): Promise<any> {}
  async get(data: any): Promise<any> {}
  async getAll(data: any): Promise<any> {}
  async getOrderBy(data: any, DESC: boolean): Promise<any> {}

  executeQuery(query: string, values?: any[]): Promise<any[]>;
  executeQuery(
    query: string,
    values?: any[],
    getFields?: boolean
  ): Promise<{ rows: any[]; fields: any[] }>;

  async executeQuery(query: string, values?: any[], getFields?: boolean): Promise<any> {
    try {
      if (!this.pool) {
        throw new ClientError(ErrorCode.POOL_NOT_FOUND);
      }
      const [rows, fields] = await this.pool.query<RowDataPacket[]>(query, values);
      if (getFields) {
        return { rows, fields };
      } else {
        return rows;
      }
    } catch (error) {
      this.database
        .getLogger()
        .error({ message: "Execute query failed:\n" + query, error });
      return [];
    }
  }
}
