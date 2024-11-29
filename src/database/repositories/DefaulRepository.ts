import { Pool, RowDataPacket } from "mysql2/promise";
import ClientError from "../../error/ClientError";
import { ErrorCode } from "../../error/ClientErrorCode";

export abstract class DefautRepository {
  protected pool?: Pool;

  usePool(pool?: Pool) {
    this.pool = pool;
  }

  abstract update(id: string, data?: any): Promise<boolean>;
  abstract get(id: string): Promise<any>;
  abstract delete(id: string): Promise<void>;
  abstract getAll(): Promise<Array<any>>;

  async executeQuery(query: string, values: Array<any>): Promise<Array<any>> {
    try {
      if (!this.pool) throw new ClientError("", ErrorCode.CONNECTOR_POOL_NOT_FOUND);
      else {
        const [rows] = await this.pool.query<RowDataPacket[]>(query, values);
        return rows;
      }
    } catch (error) {
      throw new ClientError("", ErrorCode.USER_INVALID, error as Error);
    }
  }
}
