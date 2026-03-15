export interface ClientGuildConstructorOptions {
  readonly id: string;
  readonly createTimestamp?: Date;
  levelSystemActive?: boolean;

  // NoiTu game
  noituGameActive?: boolean;
  noituChannelList?: Array<string>;
  noituMaxChannel?: number;
}

export interface ClientGuildJSON {
  readonly id: string;
  readonly create_timestamp: Date;

  // Level system
  level_system_active: boolean;

  message_logger_active: boolean;

  // NoiTu game
  noitu_game_active: boolean;
  noitu_channel_list: Array<string>;
  noitu_max_channel: number;
}

export default class ClientGuild {
  public readonly id: string;
  public readonly createTimestamp: Date;

  public levelSystemActive: boolean = false;

  // Message event logger
  public messageLoggerActive: boolean = false;

  // NoiTu game
  public noituGameActive: boolean = false;
  public noituChannelList: Array<string> = [];
  public noituMaxChannel: number = 1;

  constructor(options: ClientGuildConstructorOptions) {
    this.id = options.id;
    this.createTimestamp = options.createTimestamp ?? new Date();

    // Level system
    this.levelSystemActive = options.levelSystemActive ?? false;

    // NoiTu game
    this.noituGameActive = options.noituGameActive ?? false;
    this.noituChannelList = options.noituChannelList ?? [];
    this.noituMaxChannel = options.noituMaxChannel ?? 1;
  }

  static JSONConvert(json: ClientGuildJSON) {
    return new ClientGuild({
      id: json.id,
      createTimestamp: json.create_timestamp,
      levelSystemActive: json.level_system_active,
      noituGameActive: json.noitu_game_active,
      noituChannelList: json.noitu_channel_list,
      noituMaxChannel: json.noitu_max_channel,
    });
  }

  static rowConvert(row: any) {
    return new ClientGuild({
      id: row.id,
      createTimestamp: row.create_timestamp,
      levelSystemActive: row.level_system_active == 1,
      noituGameActive: row.noitu_game_active == 1,
      noituChannelList: row.noitu_channel_list
        ? (row.noitu_channel_list as string).split("/")
        : [],
      noituMaxChannel: row.noitu_max_channel,
    });
  }

  addChannel(id: string): Array<string> {
    this.noituChannelList.push(id);
    return this.noituChannelList;
  }

  toJSON(): ClientGuildJSON {
    return {
      id: this.id,
      create_timestamp: this.createTimestamp,

      level_system_active: this.levelSystemActive,

      message_logger_active: this.messageLoggerActive,

      noitu_game_active: this.noituGameActive,
      noitu_channel_list: this.noituChannelList,
      noitu_max_channel: this.noituMaxChannel,
    };
  }
}
