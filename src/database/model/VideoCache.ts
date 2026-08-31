import { BaseModel } from "./constructor/BaseModel";

export enum FacebookAttSourceType {
  VIDEO = "video",
  IMAGE = "image",
}

export interface FacebookAttSourceObj {
  readonly sourceUrl: string;
  readonly discordProxyUrl: string;
  readonly type: FacebookAttSourceType;
}

export class FacebookAttSource extends BaseModel<FacebookAttSourceObj> {
  readonly sourceUrl: string;
  readonly discordUrl: string;
  readonly type: FacebookAttSourceType;

  constructor(options: FacebookAttSourceObj) {
    super();
    this.sourceUrl = options.sourceUrl;
    this.discordUrl = options.discordProxyUrl;
    this.type = options.type;
  }

  toJSON(): FacebookAttSourceObj {
    return {
      sourceUrl: this.sourceUrl,
      discordProxyUrl: this.discordUrl,
      type: this.type,
    };
  }
}

export interface FacebookVideoGuildCacheJson {
  readonly guiidId: string;
  attachments: FacebookAttSourceObj[];
}

export class FacebookVideoGuildCache extends BaseModel<FacebookVideoGuildCacheJson> {
  readonly guildId: string;
  attachments: FacebookAttSource[] = [];

  constructor(options: FacebookVideoGuildCacheJson) {
    super();

    this.guildId = options.guiidId;
    this.attachments = options.attachments.map((obj) => new FacebookAttSource(obj));
  }

  toJSON(): FacebookVideoGuildCacheJson {
    return {
      guiidId: this.guildId,
      attachments: this.attachments.map((m) => m.toJSON()),
    };
  }
}
