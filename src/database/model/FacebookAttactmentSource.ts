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
  readonly discordfileSources: DiscordfileSources[];
}

export class FacebookAttachmentSource extends BaseModel<FacebookAttachmentSourceJSON> {
  readonly facebookSource: string;
  readonly discordImageSources: DiscordImageSources[];
  readonly discordVideoSources: DiscordVideoSources[];
  readonly discordfileSources: DiscordfileSources[];

  constructor(options: FacebookAttachmentSourceJSON) {
    super(options);

    this.facebookSource = options.facebookSource;
    this.discordImageSources = options.discordImageSources;
    this.discordVideoSources = options.discordVideoSources;
    this.discordfileSources = options.discordfileSources;
  }

  toJSON(): FacebookAttachmentSourceJSON {
    return {
      facebookSource: this.facebookSource,
      discordVideoSources: this.discordVideoSources,
      discordfileSources: this.discordfileSources,
      discordImageSources: this.discordImageSources,
    };
  }
}
