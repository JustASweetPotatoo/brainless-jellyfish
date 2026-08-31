import DatabaseManager from "../DatabaseManager";
import {
  FacebookAttachmentSource,
  FacebookAttachmentSourceJSON,
} from "../model/FacebookAttactmentSource";
import { Repository } from "./constructor/Repository";

export default class FacebookAttachmentSourceRepo extends Repository<
  FacebookAttachmentSource,
  FacebookAttachmentSourceJSON
> {
  protected readonly createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${this.fullTableName}
    (
      facebook_source VARCHAR(64) NOT NULL PRIMARY KEY,
      video_attachments JSON,
      image_attachments JSON,
      file_attachments JSON
    );
  `;

  constructor(database: DatabaseManager) {
    super("facebook-att-source", database);
  }

  async create(data: FacebookAttachmentSource): Promise<FacebookAttachmentSource> {
    const json = data.toJSON();

    const query = `
      INSERT IGNORE INTO ${this.fullTableName}
      (facebook_source, video_attachments, image_attachments, file_attachments)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      json.facebookSource,
      JSON.stringify(json.discordVideoSources),
      JSON.stringify(json.discordImageSources),
      JSON.stringify(json.discordFileSources),
    ];

    await this.executeQuery(query, values);

    return data;
  }

  async update(data: FacebookAttachmentSource): Promise<FacebookAttachmentSource> {
    const json = data.toJSON();

    const query = `
      UPDATE ${this.fullTableName}
      SET
        video_attachments = ?, 
        image_attachments = ?, 
        file_attachments = ?
      WHERE facebook_source = ?
    `;

    await this.executeQuery(query, [
      JSON.stringify(json.discordVideoSources),
      JSON.stringify(json.discordImageSources),
      JSON.stringify(json.discordFileSources),
      json.facebookSource,
    ]);

    return data;
  }

  async delete(guildId: string): Promise<boolean> {
    const query = `DELETE FROM ${this.fullTableName} WHERE facebook_source = ?`;

    await this.executeQuery(query, [guildId]);

    return true;
  }
  async get(facebookSource: string): Promise<FacebookAttachmentSource | undefined> {
    const query = `SELECT * FROM ${this.fullTableName} WHERE facebook_source = ? LIMIT 1`;

    const row = (await this.executeQuery(query, [facebookSource])).at(0);

    if (!row) {
      // const fbAttSource = new FacebookAttachmentSource({
      //   facebookSource: facebookSource,
      //   discordFileSources: [],
      //   discordImageSources: [],
      //   discordVideoSources: [],
      // });
      // await this.create(fbAttSource);
      // return fbAttSource;

      return undefined;
    }

    return new FacebookAttachmentSource({
      facebookSource: facebookSource,
      discordFileSources: row.file_attachments,
      discordImageSources: row.image_attachments,
      discordVideoSources: row.video_attachments,
    });
  }

  protected model: { fromJSON(json: FacebookAttachmentSourceJSON): FacebookAttachmentSource };
}
