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

  constructor(readonly tableName: string, database: DatabaseManager) {
    super();
    this.database = database;
    this.databaseName = database.name;
    this.pool = database.defaultPool;

    this.fullTableName = `\`${this.databaseName}\`.\`${this.tableName}\``;
  }

  async createTable(query: string, values: Array<any>): Promise<boolean> {
    await this.executeQuery(query, values);
    return true;
  }

  async create(data: any): Promise<any> {}
  async update(data: any): Promise<any> {}
  async delete(data: any): Promise<any> {}

  async get(data: any): Promise<any> {}
  async getAll(data: any): Promise<any> {}
  async getOrderBy(data: any, DESC: boolean): Promise<any> {}

  async executeQuery(query: string, values: Array<any>): Promise<Array<any>> {
    try {
      if (!this.pool) {
        throw new ClientError(ErrorCode.POOL_NOT_FOUND);
      } else {
        const [rows] = await this.pool.query<RowDataPacket[]>(query, values);
        return rows;
      }
    } catch (error) {
      this.database.getLogger().error("Execute query failed: \n" + query, error);
      return [];
    }
  }
}
