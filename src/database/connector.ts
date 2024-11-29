import { ConnectionOptions, createPool, Pool } from "mysql2/promise";
import SuwaBot from "../bot/SuwaBot";

export default class DBConnector {
  // private readonly client: SuwaBot;
  private readonly connectionOptions: ConnectionOptions = {
    host: "localhost",
    user: "root",
    password: "MySQLServer",
  };

  public pool?: Pool;

  constructor() {
    // this.client = client;
  }

  createPromisePool(connectionOptions?: ConnectionOptions) {
    try {
      if (this.pool) this.pool = undefined;
      if (connectionOptions) {
        this.pool = createPool(connectionOptions);
      } else {
        this.pool = createPool(this.connectionOptions);
      }
      return this.pool;
    } catch (error) {
      return error;
    }
  }
}
