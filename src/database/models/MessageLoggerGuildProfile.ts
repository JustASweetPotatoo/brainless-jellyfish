import { Locale } from "discord.js";

export default class MessageLoggerGuildProfile {
  readonly guildId: string;
  public channelId: string = "";
  public locate?: Locale;

  constructor(guildId: string) {
    this.guildId = guildId;
  }

  toJSON() {
    return {
      guildId: this.guildId,
      channelId: this.channelId,
      region: this.locate ? this.locate.toString() : "en-US" ,
    };
  }
}
