import { ConnectingWordGameGuildConfigJSON } from "./interface";

export abstract class GuildModuleConfig {
  public readonly guildId: string;
  constructor(guildId: string) {
    this.guildId = guildId;
  }
}

export class ConnectingWordGameGuildConfig extends GuildModuleConfig {
  public activate: boolean = false;
  public maxChannel: number = 1;
  public ignoredCharacterPrefix: string = ">";
  public notificationDeleteTimeout: number = 5000; // Miliseconds

  constructor(guildId: string) {
    super(guildId);
  }

  sync(data: ConnectingWordGameGuildConfigJSON) {
    this.activate = data.activate;
    this.maxChannel = data.max_channel;
    this.ignoredCharacterPrefix = data.ignored_character_prefix;
    this.notificationDeleteTimeout = data.notification_delete_timeout;
    return this;
  }

  toJSON(): ConnectingWordGameGuildConfigJSON {
    return {
      guild_id: this.guildId,
      max_channel: this.maxChannel,
      activate: this.activate,
      ignored_character_prefix: this.ignoredCharacterPrefix,
      notification_delete_timeout: this.notificationDeleteTimeout,
    };
  }
}
