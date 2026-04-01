import { Pool, RowDataPacket } from "mysql2/promise";
import DatabaseManager from "../../DatabaseManager";
import { BaseModel } from "../../model/constructor/BaseModel";

export interface RepositoryOptions {
  readonly database: DatabaseManager;
}

export abstract class BaseRepository<TModel, TJSON> {
  abstract create(data: TModel): Promise<TModel>;
  abstract update(data: TModel): Promise<TModel>;
  abstract delete(id: string): Promise<boolean>;

  abstract get(options: any): Promise<TModel | null>;
  abstract getAll(): Promise<TModel[]>;
  abstract getOrderBy(column: keyof TJSON, desc?: boolean): Promise<TModel[]>;
}

export abstract class Repository<
  TModel extends BaseModel<TJSON>,
  TJSON
> extends BaseRepository<TModel, TJSON> {
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

    this.database.on("database-connected", async () => {
      await this.createTable();
    });
  }

  async createTable(): Promise<boolean> {
    try {
      await this.executeQuery(this.createTableQuery);
      this.database.getLogger().success(`Table ${this.tableName} created`);
      return true;
    } catch (err) {
      this.database.getLogger().error(err);
      return false;
    }
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
      `SELECT * FROM ${this.fullTableName} ORDER BY ${String(column)} ${
        desc ? "DESC" : "ASC"
      }`
    );

    return this.mapRows(rows as TJSON[]);
  }

  async executeQuery(query: string, values?: any[]): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(query, values);
    return rows;
  }
}
