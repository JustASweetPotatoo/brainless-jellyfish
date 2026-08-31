import { BaseModel } from "./constructor/BaseModel";

export interface DiscordMediaSource {
  readonly facebookSource: string;
  readonly discordMediaSource: string;
  /**
   * @description Zero index based
   */
  readonly index: number;
}

export interface DiscordImageSources extends DiscordMediaSource {}
export interface DiscordVideoSources extends DiscordMediaSource {}
export interface DiscordfileSources extends DiscordMediaSource {}

export interface FacebookAttachmentSourceJSON {
  readonly facebookSource: string;
  readonly discordImageSources: DiscordImageSources[];
  readonly discordVideoSources: DiscordVideoSources[];
  readonly discordFileSources: DiscordfileSources[];
}

export class FacebookAttachmentSource extends BaseModel<FacebookAttachmentSourceJSON> {
  readonly facebookSource: string;
  readonly discordImageSources: DiscordImageSources[];
  readonly discordVideoSources: DiscordVideoSources[];
  readonly discordFileSources: DiscordfileSources[];

  constructor(options: FacebookAttachmentSourceJSON) {
    super();

    this.facebookSource = options.facebookSource;
    this.discordImageSources = options.discordImageSources;
    this.discordVideoSources = options.discordVideoSources;
    this.discordFileSources = options.discordFileSources;
  }

  toJSON(): FacebookAttachmentSourceJSON {
    return {
      facebookSource: this.facebookSource,
      discordVideoSources: this.discordVideoSources,
      discordFileSources: this.discordFileSources,
      discordImageSources: this.discordImageSources,
    };
  }
}
