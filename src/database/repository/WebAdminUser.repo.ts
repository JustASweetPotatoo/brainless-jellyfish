import DatabaseManager from "../DatabaseManager";
import AdminUser, { AdminUserObj } from "../model/WebAdminUser";
import { Repository } from "./constructor/Repository";

export default class AdminUserRepository extends Repository<AdminUser, AdminUserObj> {
  protected model: { fromJSON(json: AdminUserObj): AdminUser };

  protected readonly createTableQuery: string = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName}
    (
      email VARCHAR(255) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
  `;

  constructor(database: DatabaseManager) {
    super("web-admin-user", database);
  }

  async get(email: string): Promise<AdminUser | undefined> {
    const query = `SELECT * FROM ${this.fullTableName} WHERE \'email\' == ?`;
    const values = [email];
    const row = (await this.executeQuery(query, values)).at(0);

    if (row) {
      return this.model.fromJSON(row as AdminUserObj);
    }

    return undefined;
  }

  async create(user: AdminUserObj): Promise<AdminUser> {
    const query = `
      INSERT INTO ${this.fullTableName}
      (\'email\', \'name\')
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE \'name\' = ?
    `;
    const values = [user.email, user.name, user.name];
    await this.executeQuery(query, values);

    return this.model.fromJSON(user);
  }

  async update(user: AdminUserObj): Promise<AdminUser> {
    const query = `
      INSERT INTO ${this.fullTableName}
      (\'email\', \'name\')
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE \'name\' = ?
    `;
    const values = [user.email, user.name, user.name];
    await this.executeQuery(query, values);

    return this.model.fromJSON(user);
  }

  async delete(email: string): Promise<boolean> {
    const query = `DELETE * FROM ${this.fullTableName} WHERE \'email\' = ?`;
    const values = [email];
    await this.executeQuery(query, values);
    return true;
  }
}
