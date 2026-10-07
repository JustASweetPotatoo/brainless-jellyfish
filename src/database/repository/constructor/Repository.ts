import { Pool, RowDataPacket } from "mysql2/promise";
import DatabaseManager from "../../DatabaseManager";
import { BaseModel } from "../../model/constructor/BaseModel";
import ClientError from "../../../error/ClientError";
import { ErrorCode } from "../../../error/ErrorCode";

export interface RepositoryOptions {
  readonly database: DatabaseManager;
}

export abstract class BaseRepository<TModel, TJSON> {
  abstract create(data: TModel): Promise<TModel>;
  abstract update(data: TModel): Promise<TModel>;
  abstract delete(id: string): Promise<boolean>;

  abstract get(options: any): Promise<TModel | undefined>;
  abstract getAll(): Promise<TModel[]>;
  abstract getOrderBy(column: keyof TJSON, desc?: boolean): Promise<TModel[]>;
}

export abstract class Repository<TModel extends BaseModel<TJSON>, TJSON> extends BaseRepository<
  TModel,
  TJSON
> {
  protected readonly database: DatabaseManager;
  protected readonly pool: Pool;

  public readonly tableName: string;
  public readonly databaseName: string;
  public readonly fullTableName: string;

  protected abstract readonly createTableQuery: string;
  protected abstract readonly model: {
    fromJSON(json: TJSON): TModel;
  };

  constructor(tableName: string, database: DatabaseManager) {
    super();

    this.database = database;
    this.pool = database.defaultPool;

    this.tableName = tableName;
    this.databaseName = database.name;

    this.fullTableName = `\`${this.databaseName}\`.\`${this.tableName}\``;
  }

  async createTable(): Promise<boolean> {
    try {
      const tableExists =
        (await this.executeQuery(`SHOW TABLES LIKE ?`, [this.tableName])).length > 0;

      if (!tableExists) {
        await this.executeQuery(this.createTableQuery);

        this.database.getLogger().ok(`Table ${this.tableName} created`);

        return true;
      }

      this.database.getLogger().ok(`Table ${this.tableName} already exists`);

      return true;
    } catch (err) {
      this.database.getLogger().error(err);
      return false;
    }
  }
  private parseCreateTableColumns(createTableQuery: string): string[] {
    const bodyMatch = createTableQuery.match(/\(([^)]*)\)/s);
    if (!bodyMatch) return [];

    return bodyMatch[1]
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part && !/^(PRIMARY|CONSTRAINT|UNIQUE|KEY|FOREIGN)\b/i.test(part));
  }

  private extractColumnName(definition: string): string | null {
    const match = definition.match(/^`?([a-zA-Z0-9_]+)`?/i);
    return match ? match[1] : null;
  }

  protected mapRow(row: TJSON): TModel {
    return this.model.fromJSON(row);
  }

  protected mapRows(rows: TJSON[]): TModel[] {
    return rows.map((r) => this.mapRow(r));
  }

  async getAll(): Promise<TModel[]> {
    const rows = await this.executeQuery(`SELECT * FROM ${this.fullTableName}`);

    return this.mapRows(rows as TJSON[]);
  }

  async getOrderBy(column: keyof TJSON, desc = false): Promise<TModel[]> {
    const rows = await this.executeQuery(
      `SELECT * FROM ${this.fullTableName} ORDER BY ${String(column)} ${desc ? "DESC" : "ASC"}`,
    );

    return this.mapRows(rows as TJSON[]);
  }

  async executeQuery(query: string, values?: any[]): Promise<RowDataPacket[]>;

  async executeQuery(query: string, values?: any[], unique?: boolean): Promise<RowDataPacket>;

  /**
   *
   * @returns {RowDataPacket[] | RowDataPacket} If error, return an empty array
   */
  async executeQuery(
    query: string,
    values?: any[],
    unique?: boolean,
  ): Promise<RowDataPacket[] | RowDataPacket> {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(query, values);

      if (unique) {
        return rows[0];
      }
      return rows;
    } catch (error) {
      this.database.getLogger().error(error);
      return [];
    }
  }
}
